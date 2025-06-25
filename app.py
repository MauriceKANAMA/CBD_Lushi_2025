from flask import Flask, request, jsonify, render_template, Response
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import shape, Point
from dotenv import load_dotenv
import requests
from flask_cors import CORS
import os

load_dotenv()

# Configuration de la connexion a PostgreSQL/PostGIS
DB_URL = (
    f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

app = Flask(__name__)
CORS(app)

# Configuration de la base de données
app.config['SQLALCHEMY_DATABASE_URI'] = DB_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Definition de la route
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

def serialize_inventaire(obj):
    point = to_shape(obj.geom)
    return {
        'id': obj.id,
        'geom': {'lat': point.y, 'lng': point.x},
        'Nilots': obj.Nilots,
        'NomEtabliss': obj.NomEtabliss,
        'Categorie': obj.Categorie,
        'Sous_categorie': obj.Sous_categorie,
        'Rubriques': obj.Rubriques,
        'Description': obj.Description,
        'Avenue': obj.Avenue,
        'Date': obj.Date
    }

# Creation des API Rest

# Creation des routes Rest GET pour l'inventaire
@app.route('/api/inventaire', methods=['GET'])
def get_all_inventaire():
    items = Inventaire.query.all()
    return jsonify([serialize_inventaire(item) for item in items])

@app.route('/api/inventaire/<int:item_id>', methods=['GET'])
def get_inventaire(item_id):
    item = Inventaire.query.get_or_404(item_id)
    return jsonify(serialize_inventaire(item))

@app.route('/api/inventaire/geojson', methods=['GET'])
def get_geojson():
    items = Inventaire.query.all()
    features = []
    for item in items:
        point = to_shape(item.geom)
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [point.x, point.y]
            },
            "properties": {
                "id": item.id,
                "NomEtabliss": item.NomEtabliss,
                "Categorie": item.Categorie,
                # etc.
            }
        })
    return jsonify({"type": "FeatureCollection", "features": features})

# Creation des routes Rest POST pour l'inventaire
@app.route('/api/inventaire', methods=['POST'])
def add_inventaire():
    data = request.get_json()
    if not data or 'geom' not in data or 'lat' not in data['geom'] or 'lng' not in data['geom']:
        return jsonify({'error': 'Requête mal formée'}), 400

    point = from_shape(Point(data['geom']['lng'], data['geom']['lat']), srid=4326)

    item = Inventaire(
        geom=point,
        Nilots=data.get('Nilots'),
        NomEtabliss=data.get('NomEtabliss'),
        Categorie=data.get('Categorie'),
        Sous_categorie=data.get('Sous_categorie'),
        Rubriques=data.get('Rubriques'),
        Description=data.get('Description'),
        Avenue=data.get('Avenue'),
        Date=data.get('Date')
    )
    db.session.add(item)
    db.session.commit()
    
    return jsonify(serialize_inventaire(item)), 201


# Creation des routes Rest DELETE pour l'inventaire
@app.route('/api/inventaire/<int:item_id>', methods=['DELETE'])
def delete_inventaire(item_id):
    item = Inventaire.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item supprimé'})

# Route pour la page d'accueil
@app.route('/')
def homePage():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)