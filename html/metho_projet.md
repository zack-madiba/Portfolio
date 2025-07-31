## 1. Collecte des données et Analyse de l'architechturedes données brutes :

La fonction `download_file` collecte les données grace à une fonction pyton. On utilise la biblotheque 'requests'  et sa méthode 'get' pour requetter et arecuperer les données On utilise la biblithoque 'io bytes pour manipuler les données directement en mémoire, sans jamais l’enregistrer sur disque en dans un fichier. Dans le cadre de cette exercice j'ai effectuer une sauvegarde des données brutes en local.

```python
import pandas as pd
import requests
from io import BytesIO
import sqlite3
import numpy as np
import time


url = "https://docs.google.com/spreadsheets/d/1-ozQDxIBwo-XhgNrfqDZaPwlN9j88c8E/export?format=xlsx&id=1-ozQDxIBwo-XhgNrfqDZaPwlN9j88c8E"
save_path = "data.csv
def download_file(url, save_path) : 
    try:        response = requests.get(url)
        if response.status_code == 200:
            df = pd.read_excel(BytesIO(response.content))
            df.to_csv(save_path, index=False)
            print("Le fichier a été téléchargé avec succès dans ", save_path)
            return df
    except requests.exceptions.RequestException as e:
        print(f"Une erreur s'est produite : {e}")

print(f"Fichier {save_path} telelchargé")
```

Une fois eles donné telechargés, onprends le temps de les analyser, reperer les colonnes qui ne ne serviront pas, les colonnes à formater et celles à renommer.

On a ensuite analysé les données brutes est pour identifier les colonnes / lignes qui auront besoin de transformation à l 'exemple des colonnes :

qui sont à formater

![](c:%5CUsers%5Cofral%5CPictures%5CScreenshots%5Craxw_data.png)

```python

```

qui sont à supprimer, `["Investisseur.statut", "Statut match", "Typologie"].`

On verifie les types de colonnes et determine lesquelles nous aiderons lors de la creation de notre bdd entend que clé primaire on shématise notre bdd  et notre workflow

de données :

Shéma BDD :

![](c:%5CUsers%5Cofral%5CDownloads%5Cprojet%20pour%20porte%20folio%5Cshema%20bdd.png)

Workflow :

![](c:%5CUsers%5Cofral%5CPictures%5CScreenshots%5CCapture%20d'%C3%A9cran%202025-07-27%20161519.png)

Nous avons fait  le choix d'une stucture dimensionnelle en etoile opour faciliter le comprehension et son analyse

### 2. Nettoyage et transformation des données.

```python
def nettoyer_donnees_investisseurs(save_path):

    df_raw = pd.read_csv(save_path)
    df_cleaned = df_raw.copy()
  
    # Variables contenantles connes  qui seront transformées
    columns_raw = ["Investisseur.statut", "Statut match", "Typologie", "Unnamed: 16"]
    cols_to_drop = ["Contact client", "Adresse email", "Nom CP", "Prénom", "Client Principal", "Unnamed: 16"]
    montan_k = ["Montant estimé"]
    df_cleaned['contact investisseur'] = np.nan
    df_cleaned['contact investisseur'] = df_cleaned['contact investisseur'].astype(object)

    # Nettoyage des colonnes sicontenant les identifiant et les valeurs dans une seule cellule
    for col in columns_raw:
        df_cleaned[col] = df_cleaned[col].astype(str).str.split(' ', n=1).str[1]

    # Nettoyage du caractères K dans la colonne "montant estimé" et on remplace 'k' par 
    # Conversion en float (montants en K€ → €)
    for col in montan_k:
        df_cleaned[col] = df_cleaned[col].replace({r"[Kk]": ""}, regex=True)
        df_cleaned[col] = df_cleaned[col] * 1000
        df_cleaned[col] = df_cleaned[col].fillna(0).infer_objects()

    # On créun colonne ou l'on aura les non et prenoms des investisseur
    #cette colonne ne devrait pas avoir de valeur manquante.
  
    for i, row in df_cleaned.iterrows():
        nom_val = row.get("Nom CP")
        prenom_val = row.get("Prénom")
        client_principal_val = row.get("Client Principal")
        investisseur_val = row.get("Investisseur")

        # Vérifie que nom et prénom ne sont pas NaN ni vides
        if pd.notna(nom_val) and pd.notna(prenom_val) and str(nom_val).strip() != "" and str(prenom_val).strip() != "":
            contact = f"{str(nom_val).strip()} {str(prenom_val).strip()}"
        elif pd.notna(client_principal_val) and str(client_principal_val).strip() != "":
            contact = str(client_principal_val).strip()
        elif pd.notna(investisseur_val) and str(investisseur_val).strip() != "":
            contact = str(investisseur_val).strip()
        else:
            contact = np.nan

        df_cleaned.at[i, 'contact investisseur'] = contact
        ...

```

Une fois les données 'nettoyé' on peut passer à la creation de la bdd.

Comme vue  plus haut , creer notre bdd sera en etoile. Notons que l'on va d'abord creer une bdd qui va nous servire de table de reference (raw_data) pour l'insetion de données.

creation de bdd Sqlite :

```python
import sqlite3

db_path = "match.db"
conn = sqlite3.connect(db_path) #creation de la bdd
df_cleaned.to_sql("raw_data", conn, if_exists="replace", index=False) # creation de la table raw_data
conn.close()
```

on cré les tables et les relations entre ces tables. Exemple :

```python
# Table typologie (dimension) : valeurs distinctes comme "VC", "BA", etc.
conn = sqlite3.connect("match.db")
cursor = conn.cursor()
cursor.execute("""CREATE TABLE IF NOT EXISTS typologie (  id_typologie INTEGER PRIMARY KEY AUTOINCREMENT, Typologie TEXT UNIQUE -- contrainte d’unicité sur le libellé);""")

# Table startup : clé primaire = id_startup depuis raw_data
cursor.execute("""CREATE TABLE IF NOT EXISTS startup (id_startup INTEGER PRIMARY KEY,nom TEXT);""")

#  la table des faits
 ...
# Table centrale : match_PRINCIPALE
cursor.execute("""
CREATE TABLE IF NOT EXISTS match_PRINCIPALE (
    id_match INTEGER PRIMARY KEY,  -- id.Match de raw_data
    typologie_id INTEGER,
    startup_id INTEGER,
    statut_investissement_id INTEGER,
    investisseur_ID INTEGER,
    statut_match_id INTEGER,
    depot TEXT,
    montant_estimé REAL,
    commentaire TEXT,

    FOREIGN KEY (typologie_id) REFERENCES typologie(id_typologie),
    FOREIGN KEY (startup_id) REFERENCES startup(id_startup),
    FOREIGN KEY (statut_investissement_id) REFERENCES statut_investissement(id_statut_investissement),
    FOREIGN KEY (investisseur_ID) REFERENCES investisseur(ID_investisseur),
    FOREIGN KEY (statut_match_id) REFERENCES statut_match(ID_statut_match)
);
""")
conn.commit()
conn.close()

```

### On n'oublie pas defermer la BDD au risque de creer des erreur ou un conflit.

Apres notre bdd créé on insert les données à partir de la tables dans laquelle on a stocqué les données 'brutes' (entre guillemets car elle ne sont pas totalements brutes car on y a efectué un

premier nettoyage avec python.

<b><span style="color:rgba(244,63,94,1)">Remarque </span></b>: vous verrez en dessous que nous effectuerons aussi le nettoyage des données avec des requetes SQL.

```python
import sqlite3
import pandas as pd

conn = sqlite3.connect("match.db")
cursor = conn.cursor()

# Lecture de raw_data
df = pd.read_sql_query("SELECT * FROM raw_data", conn)

cursor.executemany("""
    INSERT OR IGNORE INTO typologie (Typologie)
    VALUES (?)
""", df[["Typologie"]].drop_duplicates().dropna().values)

cursor.executemany("""
    INSERT OR IGNORE INTO statut_match (statut_match)
    VALUES (?)
""", df[["Statut match"]].drop_duplicates().dropna().values)

cursor.executemany("""
    INSERT OR IGNORE INTO statut_investissement (statut_investissement)
    VALUES (?)
""", df[["Investisseur.statut"]].drop_duplicates().dropna().values)

...
```

### Explication de ce que fait la 1ère requete de ce bloc de code :

On recupère la valeur `.values` de la colonne Typologie de notrre dataframe `df[['Typologie']]` ,on les insere ou ignore (`INSERT OR IGNORE`). Ce  qui evite aussi les doublons.

Plusieurs lignes soont ajoutées d'un coup  `executemany` dans la table typologie. on recupère les valeur.

Pour inserer les données dans notre table centrale ou table de fait on utilise les méthode Python `.get` et `.append` pour

Une fois les données en BDD on peut se rendre  dans SQlite pour les exploiter.

### 3. Exploitation des données

<b><i><span style="color:rgba(244,63,94,1)">Note </span></i></b>***: Nous utiliseraons DB Browser et repondrons a quelques questions .*** 

1. Quels sont les investisseurs les plus actifs (nombre de startups rencontrées,  nous afficherons les 3 premiers) ?

```sql
select count(DISTINCT(m.startup_id)) as "Total recommendation" , investisseur.investisseur as Nom
from match_PRINCIPALE m
join investisseur on investisseur.ID_investisseur = m.investisseur_ID
group by Nom
order by "Total recommendation" desc limit 3;
```

![](c:%5CUsers%5Cofral%5CPictures%5CScreenshots%5Cinvestisseurs%20plus%20actis.png)

2. Combien de matchs sont à relancer selon leur typologie d'investisseur (VC, BA, Banque…) ?

```sql
select typologie.typologie as "Typologie", count(m.id_match) as total
from match_PRINCIPALE m
join typologie on typologie.id_typologie = m.typologie_id
join statut_match on statut_match.ID_statut_match = m.statut_match_id
where  statut_match.statut_match not in ('Stand by',
'Deal concurrent',
'Intérêt',
'Potentiel',
'Dossier envoyé',
'Intention',
'Hors Scope',
'Trouver contact',
'En RDV') and typologie.typologie is not null
group by "Typologie" 
order by total DESC;

```

### Notons qu'il faudrait exclure  les matchs KO,OK et deja relancés :

![](c:%5CUsers%5Cofral%5CPictures%5CScreenshots%5Cinvestisseurs%20a%20relancer.png)

### <span style="color:rgba(244,63,94,1)">Remarque</span> : on se rencompte que les colonne qui portent le meme nom que la table, posent beaucoup de pb . Il faudrait changer leur noms (Transformation des données en SQL)*.*

Exemple : `ALTER TABLE investisseur RENAME COLUMN investisseur TO nom;`

### Par la meme occasion gerer les valeurs vides. On a decidé de ne pas les nettoyer car supprimer les lignes avec une valeur vide pourrait fausser l'analyse.

Exemple :

```sql
select * from typologie
UPDATE typologie
SET typologie = 'Pas de typologie'
WHERE typologie = ''
```

3. Quelle startup a suscité le plus d’intérêt (nombre de contacts investisseurs) ?

   ```sql
   select s.nom as nom , count(si.id_statut_investissement) as Total
   from startup s
   JOIN MATCH m on m.startup_id = s.id_startup
   join statut_investissement si on si.id_statut_investissement = m.statut_investissement_id
   where si.statut_investissement = 'Contacté'
   group by nom
   order by total DESC
   limit 1;
   ```

<img src="c:%5CUsers%5Cofral%5CPictures%5CScreenshots%5Cstartup%20star.png" alt="" data-align="left"/>

### 4. Visualisation sous Power BI

La connexion de SQLITE à Power bi n'etant pas native, on passe par un driver <b><i><span style="color:rgba(59,130,246,1)">OBDC</span></i></b>

- Histogramme du nombre de relations par startup
- ![](c:%5CUsers%5Cofral%5CPictures%5CScreenshots%5Cnb_rel_statup.png)
- Camembert des typologies d'investisseurs engagés

![](c:%5CUsers%5Cofral%5CPictures%5CScreenshots%5Cinvestisseur%20engag%C3%A9s.png)

- Carte de chaleur : statut du match par typologie

![](c:%5CUsers%5Cofral%5CPictures%5CScreenshots%5Cstatut%20des%20match.png)

  

- Tableau des investisseurs à relancer

![](c:%5CUsers%5Cofral%5CPictures%5CScreenshots%5CCapture%20d'%C3%A9cran%202025-07-27%20221502.png)