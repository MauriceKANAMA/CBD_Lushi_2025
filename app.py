from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from dotenv import load_dotenv
import os


# Chargement automatiquement du fichier .env
load_dotenv()

# Vérification des variables d'environnement requises
required_env = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME']
for var in required_env:
    if not os.getenv(var):
        raise EnvironmentError(f"La variable d'environnement {var} est manquante.")
    
# Creation d'une variable de connexion vers notre base de donnees PostgreSQl
DB_URL = (
    f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DB_URL
db = SQLAlchemy(app)

@app.route("/")
def homePage():
    return render_template("index.html")

if __name__ == "__main__":
    app.run()