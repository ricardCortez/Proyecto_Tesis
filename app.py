from flask import Flask
from datetime import date, datetime
from flask_migrate import Migrate
from config import Config
from database import db
from jinja2 import Environment

app = Flask(__name__)
app.secret_key = 'mysecretkey'  # Asegúrate de que esta sea una cadena larga y aleatoria para seguridad.
app.config.from_object(Config)
app.config.from_pyfile('config.cfg')
app.jinja_env.filters['date'] = datetime.strftime

db.init_app(app)
migrate = Migrate(app, db)

#### Guarda la fecha de hoy en 2 formatos diferentes
datetoday = date.today().strftime("%m_%d_%y")
datetoday2 = date.today().strftime("%d-%B-%Y")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    from routes import routes_blueprint
    app.register_blueprint(routes_blueprint)

    app.run(debug=True)
