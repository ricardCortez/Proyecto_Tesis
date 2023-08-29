import cv2
import os
import logging
from database import db, AsistenciaLaboratorio, RegistroRostros, Usuario, AsistenciaAula, Secciones, NuevoRegistro, \
    estudiante_seccion
from flask_bcrypt import Bcrypt
import pygame
from datetime import datetime, date
import numpy as np
from app import app
from functools import wraps
from flask import redirect, url_for, session, request, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import requests
from email.message import EmailMessage
import smtplib
# Importa las configuraciones desde config.py
from correo_config import SERVIDOR_SMTP, PUERTO, CORREO_REMITENTE, CONTRASENA_REMITENTE

# Extraer la cara de una imagen
def extract_faces(img,
                  face_detector=cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')):
    if len(img) > 0:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_points = face_detector.detectMultiScale(gray, 1.3, 5)
        return face_points
    else:
        return []


# Identifica la cara usando el modelo ML
def identify_face(facearray):
    face_recognizer = cv2.face.LBPHFaceRecognizer_create()
    face_recognizer.read('static/modelo_LBPHFace.xml')

    label, _ = face_recognizer.predict(facearray)
    return label


# Función para entrenar el modelo de reconocimiento facial
def train_model():
    dataPath = 'static/faces/'  # Cambia a la ruta donde hayas almacenado Data
    peopleList = os.listdir(dataPath)
    print('Lista de personas: ', peopleList)

    labels = []
    facesData = []
    label = 0

    for nameDir in peopleList:
        personPath = os.path.join(dataPath, nameDir)
        print('Leyendo las imágenes')

        for fileName in os.listdir(personPath):
            print('Rostros: ', nameDir + '/' + fileName)
            labels.append(label)
            facesData.append(cv2.imread(os.path.join(personPath, fileName), 0))

        label = label + 1

    face_recognizer = cv2.face.LBPHFaceRecognizer_create()

    # Entrenando el reconocedor de rostros
    print("Entrenando...")
    face_recognizer.train(facesData, np.array(labels))

    # Guardando el modelo obtenido
    face_recognizer.write('static/modelo_LBPHFace.xml')
    print("Modelo almacenado...")


# Extraer información del archivo de asistencia de hoy en la carpeta de asistencia
def extract_attendance_from_db():
    try:
        attendance_records_aula = AsistenciaAula.query.all()
        attendance_records_laboratorio = AsistenciaLaboratorio.query.all()
        # Extraer los nombres, códigos y horas de los registros de asistencia en aula
        nombre_aula = [record.nombre for record in attendance_records_aula]
        codigo_alumno_aula = [record.codigo_alumno for record in attendance_records_aula]
        hora_aula = [record.hora for record in attendance_records_aula]
        # Extraer los nombres, códigos y horas de los registros de asistencia en laboratorio
        nombre_laboratorio = [record.nombre for record in attendance_records_laboratorio]
        codigo_alumno_laboratorio = [record.codigo_alumno for record in attendance_records_laboratorio]
        hora_laboratorio = [record.hora for record in attendance_records_laboratorio]
        return nombre_aula, codigo_alumno_aula, hora_aula, nombre_laboratorio, codigo_alumno_laboratorio, hora_laboratorio
    except Exception as e:
        logging.error(f"Error al extraer los registros de asistencia desde la base de datos: {str(e)}")
        return [], [], [], [], [], []

def get_section_name(section_id):
    section = db.session.query(Secciones).get(section_id)

    if section:
        return section.nombre_seccion

    return None


def student_belongs_to_section(student_code, section_id):
    # Obtén el estudiante usando el código del estudiante
    student = db.session.query(Usuario).filter(Usuario.codigo_alumno == student_code).first()

    # Debug prints
    print(f"student: {student}")
    print(f"student_code: {student_code}")
    print(f"section_id: {section_id}")

    # Verifica si el estudiante es None (no existe en la base de datos)
    if student is None:
        print(f"El estudiante con código {student_code} no existe en la base de datos.")
        return False

    # Verifica si el estudiante está en la sección
    student_sections = [sec.id for sec in student.secciones]
    print(f"student_sections: {student_sections}")
    if int(section_id) in student_sections:
        print(f"El estudiante con código {student_code} pertenece a la sección con ID {section_id}.")
        return True

    # Si no encontramos la sección en la lista de secciones del estudiante, retorna False
    print(f"El estudiante con código {student_code} no pertenece a la sección con ID {section_id}.")
    return False


def add_attendance_aula(codigo_alumno, section_id):
    fecha = date.today()
    hora = datetime.now().time()
    usuario = db.session.query(Usuario).filter(Usuario.codigo_alumno == codigo_alumno).first()
    if usuario:
        asistencia = AsistenciaAula(usuario_id=usuario.id, fecha=fecha, hora=hora, seccion_id=section_id)
        db.session.add(asistencia)
        db.session.commit()
        logging.info("Asistencia en aula registrada exitosamente.")
    else:
        logging.error(f"No se encontró el usuario con el código: {codigo_alumno}")


def add_attendance_laboratorio(numero_cubiculo, codigo_alumno, section_id):
        fecha = date.today()
        hora = datetime.now().time()
        usuario = db.session.query(Usuario).filter(Usuario.codigo_alumno == codigo_alumno).first()
        if usuario:
            asistencia = AsistenciaLaboratorio(usuario_id=usuario.id, fecha=fecha, hora=hora, seccion_id=section_id, numero_cubiculo=numero_cubiculo)
            db.session.add(asistencia)
            db.session.commit()
            logging.info("Asistencia en laboratorio registrada exitosamente.")
        else:
            logging.error(f"No se encontró el usuario con el código: {codigo_alumno}")

def get_name_from_db(nombre):
    # Supongamos que en tu tabla RegistroRostros, el nombre del registro se guarda en la columna 'nombre'
    registro_rostro = RegistroRostros.query.filter_by(nombre=nombre).first()
    if registro_rostro is not None and registro_rostro.usuario is not None:
        return registro_rostro.usuario.nombre
    else:
        return None


def get_code_from_db(codigo_alumno):
    try:
        # Realiza una consulta a la base de datos para obtener el usuario con el código de alumno
        usuario = Usuario.query.filter_by(codigo_alumno=codigo_alumno).first()
        if usuario is not None:
            return usuario.codigo_alumno
        else:
            return None
    except Exception as e:
        logging.error(f"Error al obtener el usuario desde la base de datos: {str(e)}")
        return None


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session or session['rol'] != 'Administrador':
            return redirect(url_for('routes.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def personal_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session or session['rol'] != 'Personal administrativo':
            return redirect(url_for('routes.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def docente_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session or session['rol'] != 'Docente':
            return redirect(url_for('routes.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function


bcrypt = Bcrypt(app)

def authenticate_user(usuario, contrasena):
    user = Usuario.query.filter_by(usuario=usuario).first()

    if user and bcrypt.check_password_hash(user.contrasena, contrasena):
        return user
    else:
        return None

def hash_password(password):
    return generate_password_hash(password)

def check_password(hashed_password, password):
    return check_password_hash(hashed_password, password)
# Función para mostrar la imagen de alerta y reproducir el sonido
def show_alert(frame):
    image_path = 'static/image/alert.png'
    sound_path = 'static/sound/alert.mp3'
    # Reproducir el sonido
    pygame.mixer.init()
    pygame.mixer.music.load(sound_path)
    pygame.mixer.music.play()
    # Cargar la imagen
    alert_image = cv2.imread(image_path)

    # Redimensionar la imagen para que se ajuste al tamaño del marco
    alert_image = cv2.resize(alert_image, (frame.shape[1], frame.shape[0]))

    # Superponer la imagen en el marco
    frame = cv2.addWeighted(frame, 0.7, alert_image, 0.3, 0)

    # Mostrar el texto de alerta
    cv2.putText(frame, 'ALERTA', (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    # Mostrar el marco con la imagen y el texto de alerta
    cv2.imshow('Asistencia', frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

def verify_recaptcha(response):
    payload = {
        'secret': current_app.config['RECAPTCHA_SECRET_KEY'],
        'response': response
    }
    r = requests.post('https://www.google.com/recaptcha/api/siteverify', data=payload)
    result = r.json()
    return result.get('success')

def enviar_correo(destinatario, asunto, contenido):
    msg = EmailMessage()
    msg.set_content(contenido)
    msg['Subject'] = asunto
    msg['From'] = "Recuperar cuenta <" + CORREO_REMITENTE + ">"
    msg['To'] = destinatario

    with smtplib.SMTP_SSL(SERVIDOR_SMTP, PUERTO) as server:
        server.login(CORREO_REMITENTE, CONTRASENA_REMITENTE)
        server.send_message(msg)
def correo_existe(correo):
    try:
        # Consulta el modelo NuevoRegistro
        user = NuevoRegistro.query.filter_by(correo_electronico=correo).one_or_none()
        if user:
            return True
        return False
    except Exception as e:
        print(f"Error al verificar correo: {e}")
        return False


def belongs_to_section(identified_person, section_id):
    # Primero, obtén el ID del estudiante usando el código.
    student = Usuario.query.filter_by(codigo_alumno=identified_person).first()
    if not student:
        return False  # Si no se encuentra el estudiante, regresa False.

    # Ahora, usa el ID del estudiante para consultar la tabla estudiante_seccion.
    entry = db.session.query(estudiante_seccion).filter_by(estudiante_id=student.id, seccion_id=section_id).first()

    # Si encontramos una entrada, significa que el estudiante pertenece a la sección.
    return entry is not None

