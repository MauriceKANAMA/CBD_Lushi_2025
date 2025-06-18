from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from dotenv import load_dotenv, dotenv_values
from sqlalchemy.exc import OperationalError
import os


# Charge automatiquement le fichier .env
load_dotenv()  # Par défaut, charge le fichier ".env" à la racine

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
    try:
        db.session.execute("SELECT 1")
        return render_template("index.html", status="Connexion réussie ✅")
    except OperationalError as e:
        return render_template("index.html", status=f"Erreur : {e}")

if __name__ == "__main__":
    app.run(debug=True)