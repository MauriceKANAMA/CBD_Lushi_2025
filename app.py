from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape
from shapely.geometry import shape
from dotenv import load_dotenv
import requests
import os


load_dotenv()

DB_URL = (
    f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DB_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

@app.route('/')
def homePage():
    return render_template('index.html')

@app.route("/wfs_inventaire")
def wfs_inventaire():
    # Remplace l’URL par celle de ton GeoServer
    wfs_url = "http://localhost:8080/geoserver/CBD_2025/ows"
    params = {
        "service": "WFS",
        "version": "1.0.0",
        "request": "GetFeature",
        "typeName": "CBD_2025:Inventaire",
        "maxFeatures": 50,
        "outputFormat": "application/json"
    }
    r = requests.get(wfs_url, params=params)
    return jsonify(r.json())

class Inventaire(db.Model):
    __tablename__ = 'Inventaire_complet'
    id = db.Column('id', db.Integer, primary_key=True)
    geom = db.Column(Geometry('POINT', srid=4326))
    Nilots = db.Column('n° ilots', db.String(254))
    NomEtabliss = db.Column('nom_etabli', db.String(254))
    Categorie = db.Column('categories', db.String(254))
    Sous_categorie = db.Column('sous-categ ', db.String(254))
    Rubriques = db.Column('types_rubr ', db.String(254))
    Description = db.Column('descriptio', db.String(254))
    Avenue = db.Column('adresses', db.String(254))
    Date = db.Column('time', db.String(254))

class Limites(db.Model):
    __tablename__ = 'Limites_CBD_2025'
    id = db.Column(db.Integer, primary_key=True)
    Annee = db.Column('annee', db.Integer)
    Auteur = db.Column('auteur', db.String(254))
    Surface = db.Column('surface', db.Float(8))
    geom = db.Column(Geometry('POLYGON', srid=4326))

# ---------------- Inventaire ----------------

#Methode HTTP GET
@app.route('/api/inventaire', methods=['GET'])
def get_inventaire():
    categorie = request.args.get('categorie')
    query = Inventaire.query
    if categorie:
        query = query.filter_by(categorie=categorie)
    result = []
    for inv in query.all():
        # Adapte ceci à ce que tu veux retourner (GeoJSON, ou juste des attributs)
        result.append({
            "id": inv.id,
            "categorie": inv.categorie,
            # Ajoute d'autres champs si besoin
        })
    return jsonify(result)

#Methode HTTP POST
@app.route('/api/inventaire', methods=['POST'])
def create_inventaire():
    data = request.get_json()
    geom_geojson = data.get('geometry')
    if not geom_geojson:
        return jsonify({'error': 'Aucune géométrie fournie'}), 400
    geom_shape = shape(geom_geojson)
    inventaire = Inventaire(geom=from_shape(geom_shape, srid=4326))
    db.session.add(inventaire)
    db.session.commit()
    return jsonify({'success': True, 'id': inventaire.id})

#Methode HTTP PUT
@app.route('/api/inventaire/<int:id>', methods=['PUT'])
def update_inventaire(id):
    data = request.get_json()
    inventaire = Inventaire.query.get_or_404(id)
    geom_geojson = data.get('geometry')
    if not geom_geojson:
        return jsonify({'error': 'Aucune géométrie fournie'}), 400
    geom_shape = shape(geom_geojson)
    inventaire.geom = from_shape(geom_shape, srid=4326)
    db.session.commit()
    return jsonify({'success': True})

#Methode HTTP DELETE
@app.route('/api/inventaire/<int:id>', methods=['DELETE'])
def delete_inventaire(id):
    inventaire = Inventaire.query.get_or_404(id)
    db.session.delete(inventaire)
    db.session.commit()
    return jsonify({'success': True})

# # ---------------- Bloc ----------------
# @app.route('/api/bloc', methods=['POST'])
# def create_bloc():
#     data = request.get_json()
#     geom_geojson = data.get('geometry')
#     if not geom_geojson:
#         return jsonify({'error': 'Aucune géométrie fournie'}), 400
#     geom_shape = shape(geom_geojson)
#     bloc = Bloc(geom=from_shape(geom_shape, srid=4326))
#     db.session.add(bloc)
#     db.session.commit()
#     return jsonify({'success': True, 'id': bloc.id})

# @app.route('/api/bloc/<int:id>', methods=['PUT'])
# def update_bloc(id):
#     data = request.get_json()
#     bloc = Bloc.query.get_or_404(id)
#     geom_geojson = data.get('geometry')
#     if not geom_geojson:
#         return jsonify({'error': 'Aucune géométrie fournie'}), 400
#     geom_shape = shape(geom_geojson)
#     bloc.geom = from_shape(geom_shape, srid=4326)
#     db.session.commit()
#     return jsonify({'success': True})

# @app.route('/api/bloc/<int:id>', methods=['DELETE'])
# def delete_bloc(id):
#     bloc = Bloc.query.get_or_404(id)
#     db.session.delete(bloc)
#     db.session.commit()
#     return jsonify({'success': True})

# ---------------- Limites ----------------
@app.route('/api/inventaire', methods=['GET'])
def get_limites():
    categorie = request.args.get('limites')
    query = Inventaire.query
    if categorie:
        query = query.filter_by(categorie=categorie)
    result = []
    for inv in query.all():
        # Adapte ceci à ce que tu veux retourner (GeoJSON, ou juste des attributs)
        result.append({
            "id": inv.id,
            "categorie": inv.limites,
            # Ajoute d'autres champs si besoin
        })
    return jsonify(result)

@app.route('/api/limites', methods=['POST'])
def create_limites():
    data = request.get_json()
    geom_geojson = data.get('geometry')
    if not geom_geojson:
        return jsonify({'error': 'Aucune géométrie fournie'}), 400
    geom_shape = shape(geom_geojson)
    limites = Limites(geom=from_shape(geom_shape, srid=4326))
    db.session.add(limites)
    db.session.commit()
    return jsonify({'success': True, 'id': limites.id})

@app.route('/api/limites/<int:id>', methods=['PUT'])
def update_limites(id):
    data = request.get_json()
    limites = Limites.query.get_or_404(id)
    geom_geojson = data.get('geometry')
    if not geom_geojson:
        return jsonify({'error': 'Aucune géométrie fournie'}), 400
    geom_shape = shape(geom_geojson)
    limites.geom = from_shape(geom_shape, srid=4326)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/limites/<int:id>', methods=['DELETE'])
def delete_limites(id):
    limites = Limites.query.get_or_404(id)
    db.session.delete(limites)
    db.session.commit()
    return jsonify({'success': True})

if __name__ == "__main__":
    app.run()