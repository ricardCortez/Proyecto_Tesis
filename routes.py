import base64
import logging
from datetime import datetime, date
import random
import os
import imutils
import cv2
import csv
import json
import pandas as pd
import pdfcrowd
from pandas import isna
from sqlalchemy import or_
from flask import Blueprint, render_template, flash, request, jsonify, session, redirect, Response, \
make_response
from sqlalchemy.exc import IntegrityError
from database import Usuario, RegistroRostros, db, NuevoRegistro, AsistenciaAula, AsistenciaLaboratorio, Secciones, \
    profesor_seccion, estudiante_seccion, RostrosNoReconocidos
from functions import add_attendance_aula, add_attendance_laboratorio, train_model, \
    extract_attendance_from_db, get_code_from_db, hash_password, get_name_from_db, check_password, \
    admin_required, personal_required, docente_required, get_section_name, correo_existe, \
    enviar_correo, belongs_to_section, verify_recaptcha, get_section_details
from app import datetoday2
from werkzeug.security import generate_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

routes_blueprint = Blueprint('routes', __name__)
# Agrega esta línea al principio del archivo para inicializar la lista de cubículos disponibles
cubiculos_disponibles = list(range(1, 61)) #cubiculos 60
@routes_blueprint.route('/')
def index():
    return render_template('index.html')

@routes_blueprint.route('/main')
def main():
    return render_template('main.html')

@routes_blueprint.route('/logadm')
def login_1():
    return render_template('login.html')
# ------------------------- rutas del administrador --------------------
@routes_blueprint.route('/administrador')
@admin_required
def panel_admin():
    return render_template('panel_administrador.html')

@routes_blueprint.route('/new')
@admin_required
def people():
    return render_template('nuevo_registro.html')

@routes_blueprint.route('/up')
@admin_required
def upload_form():
    return render_template('upload.html')

@routes_blueprint.route('/reg')
def home():
    return render_template('registro-alumno.html')

@routes_blueprint.route('/reg_alumno')
def reg_alumno():
    return render_template('nuevo_alumno.html')
@routes_blueprint.route('/ver_reporte')
def ver_reporte():
    return render_template('ver_asistencia_general.html')

@routes_blueprint.route('/validar')
def validar():
    return render_template('students_report.html')

# ------------------------- fin de las rutas del administrador --------------------

# ------------------------- rutas del personal administrativo --------------------
@routes_blueprint.route('/administrativo')
@personal_required
def panel_administrativo():
    return render_template('panel_administrativo.html')
@routes_blueprint.route('/per')
def panel_personal():
    return render_template('asignar_secciones_alumnos.html')  #### alumnos
@routes_blueprint.route('/doc')
def documentos():
    return render_template('asignar_secciones.html') ### docentes
@routes_blueprint.route('/search')
def search():
    return render_template('search_student.html') ### docentes
@routes_blueprint.route('/reporte_asistencia')
def reporte_asistencia():
    return render_template('ver_asistencia.html')
@routes_blueprint.route('/reporte')
#@personal_required
def reporte():
    return render_template('reporte.html') #### estudiantes y secciones
@routes_blueprint.route('/reporte docente')
def reporte_docente():
    return render_template('reporte_docente.html')
@routes_blueprint.route('/reporte_inasistencia')
def reporte_inasistencia():
    return render_template('reporte_inasistencia.html')

# ------------------------- fin de las rutas del personal administrativo --------------------
# ------------------------- rutas del docente --------------------
@routes_blueprint.route('/docente')
@docente_required
def panel_docente():
    return render_template('panel_docente.html') #### principal
@routes_blueprint.route('/get_attendance_aula', methods=['GET'])
def get_attendance_aula():
    return render_template('attendance_aula.html')
@routes_blueprint.route('/get_attendance_laboratorio', methods=['GET'])
def get_attendance_laboratorio():
    return render_template('attendance_laboratorio.html')
@routes_blueprint.route('/busqueda_alumnos')
def busqueda_alumnos():
    return render_template('resultados_busqueda.html')
@routes_blueprint.route('/verasistencia')
def ver_asistencia():
    return render_template('ver_asistencia.html')
# ------------------------- fin de rutas del docente --------------------

#------------------------ INICIO DE FUNCIONES --------------------------------
@routes_blueprint.route('/start/aula', methods=['GET', 'POST'])
def start_aula():
    cap = cv2.VideoCapture(0)
    ret = True
    recognized_users = set()
    frame = None
    detection_counters = {}

    face_recognizer = cv2.face.LBPHFaceRecognizer_create()
    face_recognizer.read('static/modelo_LBPHFace.xml')

    faceClassif = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    dataPath = 'static/faces'
    imagePaths = os.listdir(dataPath)

    section_id = request.form['section_name']
    section = get_section_details(section_id)
    if section:
        section_name = section.nombre_seccion
        tipo_seccion = section.tipo_seccion
    else:
        flash('Error: no se pudo encontrar la sección.', 'error')
        # Aquí puedes manejar el error como prefieras, por ejemplo, volviendo a renderizar la misma plantilla con un mensaje de error.
        return render_template('attendance_aula.html', error="No se pudo encontrar la sección.")

    while ret:
        ret, frame = cap.read()

        if not ret:
            flash('Error capturing video from the camera.', 'error')
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        auxFrame = gray.copy()

        faces = faceClassif.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            rostro = auxFrame[y:y + h, x:x + w]
            rostro = cv2.resize(rostro, (150, 150), interpolation=cv2.INTER_CUBIC)
            result = face_recognizer.predict(rostro)

            confidence = 0

            if result[1] < 70:
                identified_person = imagePaths[result[0]]
                recognized_users.add(identified_person)
                confidence = round((1 - (result[1] / 100)) * 100 * 2, 1)
                label_text = '{}'.format(identified_person, confidence)
                cv2.putText(frame, label_text, (x, y - 25), 2, 1.1, (0, 255, 0), 1, cv2.LINE_AA)
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

                codigo_alumno = get_code_from_db(identified_person)
                nombre = get_name_from_db(identified_person)
                if codigo_alumno:
                    if not belongs_to_section(identified_person, section_id):
                        label_text = 'No pertenece a la seccion'
                        cv2.putText(frame, label_text, (x, y - 50), 2, 1.1, (0, 0, 255), 1, cv2.LINE_AA)
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)

                        identified_person_key = f"NP_{identified_person}"
                        detection_counters[identified_person_key] = detection_counters.get(identified_person_key, 0) + 1
                    else:
                        today = date.today()
                        existing_attendance_aula = db.session.query(AsistenciaAula).join(Usuario).filter(
                            Usuario.codigo_alumno == codigo_alumno, AsistenciaAula.fecha == today).first()
                        if not existing_attendance_aula:
                            add_attendance_aula(codigo_alumno, section_id)
            else:
                cv2.putText(frame, 'Desconocido', (x, y - 20), 2, 0.8, (0, 0, 255), 1, cv2.LINE_AA)
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)

                detection_key = "Desconocido"
                detection_counters[detection_key] = detection_counters.get(detection_key, 0) + 1

            cv2.rectangle(frame, (x, y + h), (x + w, y + h + 40), (0, 0, 0), -1)
            cv2.putText(frame, 'Confianza: {}%'.format(confidence), (x, y + h + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.9,
                        (255, 255, 0), 2)

        # Verificar los contadores después del bucle de rostros
        for key, count in detection_counters.items():
            if count >= 30:
                today = date.today()  # Obtener la fecha actual

                # Para rostro no reconocido
                if key == "Desconocido":
                    existing_entry = RostrosNoReconocidos.query.filter_by(tipo='No Reconocido',
                                                                        datos='Persona sin registro',
                                                                        fecha=today).first()
                    if not existing_entry:
                        new_entry = RostrosNoReconocidos(tipo='No Reconocido',
                                                        datos='Persona sin registro',
                                                        seccion=section_name,
                                                        tipo_aula=tipo_seccion)

                        db.session.add(new_entry)

                # Para rostro reconocido que no pertenece a la sección
                elif key.startswith("NP_"):
                    user_id = key.split("_")[1]
                    user = Usuario.query.filter_by(codigo_alumno=user_id).first()
                    datos = f"{user.nombre}"
                    tipo_valor = f"No Pertecene ({section_name}"

                    existing_entry = RostrosNoReconocidos.query.filter_by(tipo=tipo_valor,
                                                                        datos=datos,
                                                                        fecha=today).first()
                    if not existing_entry:
                        new_entry = RostrosNoReconocidos(tipo=tipo_valor,
                                                        datos=datos,
                                                        seccion=section_name,
                                                        tipo_aula=tipo_seccion)
                        db.session.add(new_entry)

                detection_counters[key] = 0

        cv2.imshow('Asistencia', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    db.session.commit()

    cap.release()
    cv2.destroyAllWindows()

    if frame is not None:
        cv2.putText(frame, 'Captura de video finalizada', (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    codigo_alumno, hora, *_ = extract_attendance_from_db()
    for c, h in zip(codigo_alumno, hora):
        logging.info(f"Código: {c}, Hora: {h}")

    if request.method == "POST":
        return render_template('attendance_aula.html', codigo_alumno=codigo_alumno, hora=hora, datetoday2=datetoday2, url=request.url)

    return render_template('panel_docente.html')

@routes_blueprint.route('/asignarcubiculo', methods=['GET'])
def asignar_cubiculo():
    if cubiculos_disponibles:
        # Obtener un número de cubículo aleatorio de la lista de disponibles
        numero_cubiculo = random.choice(cubiculos_disponibles)
        # Remover el número de cubículo de la lista de disponibles
        cubiculos_disponibles.remove(numero_cubiculo)
    results = {'numero_cubiculo': numero_cubiculo}
    return jsonify(results)


@routes_blueprint.route('/start/laboratorio', methods=['GET', 'POST'])
def start_laboratorio():
    cap = cv2.VideoCapture(0)
    ret = True
    recognized_users = set()
    frame = None
    detection_counters = {}  # Contador de detecciones

    face_recognizer = cv2.face.LBPHFaceRecognizer_create()
    face_recognizer.read('static/modelo_LBPHFace.xml')
    faceClassif = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    dataPath = 'static/faces'
    imagePaths = os.listdir(dataPath)
    section_id = request.form['section_name']
    section_name = get_section_name(section_id)
    numero_cubiculo = request.form['numero_cubiculo']

    while ret:
        ret, frame = cap.read()
        if not ret:
            flash('Error capturing video from the camera.', 'error')
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        auxFrame = gray.copy()
        faces = faceClassif.detectMultiScale(gray, 1.3, 5)
        for (x, y, w, h) in faces:
            rostro = auxFrame[y:y + h, x:x + w]
            rostro = cv2.resize(rostro, (150, 150), interpolation=cv2.INTER_CUBIC)
            result = face_recognizer.predict(rostro)
            confidence = 0

            if result[1] < 70:
                identified_person = imagePaths[result[0]]
                recognized_users.add(identified_person)
                confidence = round((1 - (result[1] / 100)) * 100 * 1.5, 2)
                label_text = '{}'.format(identified_person, confidence)
                cv2.putText(frame, label_text, (x, y - 25), 2, 1.1, (0, 255, 0), 1, cv2.LINE_AA)
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

                codigo_alumno = get_code_from_db(identified_person)
                if codigo_alumno:
                    if not belongs_to_section(identified_person, section_id):
                        label_text = 'No pertenece a la seccion'
                        cv2.putText(frame, label_text, (x, y - 50), 2, 1.1, (0, 0, 255), 1, cv2.LINE_AA)
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)

                        # Incrementar el contador de rostros no pertenecientes
                        detection_key = f"NP_{identified_person}"
                        detection_counters[detection_key] = detection_counters.get(detection_key, 0) + 1
                        if detection_counters[detection_key] >= 60:  # 2 segundos si asumimos 30 fps
                            # Registro de rostro que no pertenece
                            nombre = get_name_from_db(identified_person)
                            tipo_valor = f"No Pertecene ({section_name}"
                            new_entry = RostrosNoReconocidos(tipo=tipo_valor, datos=nombre)
                            db.session.add(new_entry)
                            detection_counters[detection_key] = 0  # Reiniciar el contador

                        continue  # Saltar el resto del bucle, ya que el estudiante no pertenece a la sección

                    today = date.today()
                    existing_attendance_lab = db.session.query(AsistenciaLaboratorio).join(Usuario).filter(
                        Usuario.codigo_alumno == codigo_alumno, AsistenciaLaboratorio.fecha == today).first()
                    if not existing_attendance_lab:
                        add_attendance_laboratorio(numero_cubiculo, codigo_alumno, section_id)
            else:
                cv2.putText(frame, 'Desconocido', (x, y - 20), 2, 0.8, (0, 0, 255), 1, cv2.LINE_AA)
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)

                # Incrementar el contador para rostros desconocidos
                detection_key = "Desconocido"
                detection_counters[detection_key] = detection_counters.get(detection_key, 0) + 1
                if detection_counters[detection_key] >= 30:  # 2 segundos si asumimos 30 fps
                    new_entry = RostrosNoReconocidos(tipo='No Reconocido', datos='persona sin registro')
                    db.session.add(new_entry)
                    detection_counters[detection_key] = 0  # Reiniciar el contador

            cv2.rectangle(frame, (x, y + h), (x + w, y + h + 40), (0, 0, 0), -1)
            cv2.putText(frame, 'Confianza: {}%'.format(confidence), (x, y + h + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.9,
                        (255, 255, 0), 2)

        cv2.imshow('Asistencia', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    if frame is not None:
        cv2.putText(frame, 'Captura de video finalizada', (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    numero_cubiculo, codigo_alumno, hora, *_ = extract_attendance_from_db()
    logging.info("Datos de asistencia obtenidos de la base de datos (asistencia laboratorio):")
    for m, c, h in zip(numero_cubiculo, codigo_alumno, hora):
        logging.info(f"Codigo: {m}, Hora: {c}, Numero de cubiculo: {h}")

    if request.method == "POST":
        return render_template('attendance_laboratorio.html', codigo_alumno=codigo_alumno,
                               numero_cubiculo=numero_cubiculo, hora=hora, datetoday2=datetoday2, url=request.url)
    return render_template('panel_docente.html')


@routes_blueprint.route('/add', methods=['GET', 'POST'])
def add():
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        codigo_alumno = request.form.get('codigo_alumno')
        if not nombre:
            return jsonify(error="No se proporcionó el nombre"), 400

        if not codigo_alumno:
            return jsonify(error="No se proporcionó el código de alumno"), 400
        ruta_rostro = 'static/faces/' + str(codigo_alumno)
        if not os.path.isdir(ruta_rostro):
            os.makedirs(ruta_rostro)

        cap = cv2.VideoCapture(0)
        faceClassif = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        count = 0
        cancelled = False  # Variable para comprobar si el usuario canceló el proceso

        while True:
            ret, frame = cap.read()
            if ret == False:
                break

            frame = imutils.resize(frame, width=640)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            auxFrame = frame.copy()

            faces = faceClassif.detectMultiScale(gray, 1.3, 5)

            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                rostro = auxFrame[y:y + h, x:x + w]
                rostro = cv2.resize(rostro, (150, 150), interpolation=cv2.INTER_CUBIC)
                nombre_archivo = f'{codigo_alumno}_{count}.jpg'
                cv2.imwrite(os.path.join(ruta_rostro, nombre_archivo), rostro)
                count += 1

            cv2.putText(frame, f'Images Captured: {count}/300', (30, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.imshow('Capturando Rostros', frame)

            k = cv2.waitKey(1)
            if k == ord('q') or count >= 300:
                cancelled = True  # Usuario presionó 'q' para cancelar el proceso
                break

        cap.release()
        cv2.destroyAllWindows()

        # Si el usuario canceló el proceso, se retorna al inicio
        if cancelled:
            return render_template('add.html')

        # Busca el usuario en la base de datos utilizando el código de alumno
        print(f"Código de alumno: {codigo_alumno}")
        usuario = Usuario.query.filter_by(codigo_alumno=codigo_alumno).first()
        if usuario is None:
            print(f"No se encontró el usuario con código de alumno {codigo_alumno}")
            return jsonify(error=f"No se encontró el usuario con código de alumno {codigo_alumno}"), 404

        # Guardar los datos del registro de rostros en la base de datos
        fecha_registro = datetime.now()  # Obtener la fecha y hora actual
        registro_rostro = RegistroRostros(nombre=nombre, codigo_alumno=codigo_alumno, ruta_rostro=ruta_rostro, fecha_registro=fecha_registro, usuario_id=usuario.id)
        db.session.add(registro_rostro)
        db.session.commit()

        print('Training Model')
        train_model()
        nombre, codigo_alumno, hora, *_ = extract_attendance_from_db()

        # Guarda la ubicación de la carpeta creada en la base de datos
        user = Usuario.query.filter_by(nombre=nombre).first()
        if user is None:
            #return jsonify(error=f"No se encontró el usuario con nombre {nombre}"), 404
            pass
        user.ubicacion_carpeta = ruta_rostro
        db.session.commit()

        return render_template('registro-alumno.html', images_captured=count, total_images=300, nombre=nombre, codigo_alumno=codigo_alumno, hora=hora)
    else:
        return render_template('add.html')

@routes_blueprint.route('/upload', methods=['POST'])
def upload():
    omitted_records = []  # Lista para recolectar los mensajes de registros omitidos
    try:
        if 'csvFile' not in request.files:
            return jsonify({'message': 'No se seleccionó ningún archivo', 'status': 'error'})

        file = request.files['csvFile']
        if file.filename == '':
            return jsonify({'message': 'No se seleccionó ningún archivo', 'status': 'error'})

        if file.filename.endswith('.csv'):
            # Leer el archivo CSV con Pandas
            df = pd.read_csv(file, usecols=lambda column : column not in ['id'])

            # Iterar sobre cada fila del DataFrame y crear instancias de Usuario
            for _, row in df.iterrows():
                usuario = Usuario(
                    codigo_alumno=row['codigo_alumno'] if not isna(row['codigo_alumno']) else None,
                    nombre=row['nombre'] if not isna(row['nombre']) else None,
                    fecha_ingreso=pd.to_datetime(row['fecha_ingreso'], errors='coerce') if not isna(
                        row['fecha_ingreso']) else None,
                    ciclo_academico=row['ciclo_academico'] if not isna(row['ciclo_academico']) else None,
                    ultima_actualizacion_foto=pd.to_datetime(row['ultima_actualizacion_foto'],
                                                             errors='coerce') if not isna(
                        row['ultima_actualizacion_foto']) else None
                )
                try:
                    db.session.add(usuario)
                    db.session.commit()
                except IntegrityError:
                    db.session.rollback()
                    message = f"Error de integridad al insertar el registro: {row['codigo_alumno']} - Omitiendo este registro"
                    print(message)
                    omitted_records.append(message)

            return jsonify({'message': 'Archivo CSV subido correctamente', 'status': 'success', 'omitted_records': omitted_records})
    except Exception as e:
        print(str(e))
        import traceback
        traceback.print_exc()  # Esto imprimirá la traza del error en tu consola
        return jsonify({'message': f'Error al procesar el archivo CSV: {str(e)}', 'status': 'error'})

@routes_blueprint.route('/registro', methods=['POST'])
def registro():
    tipo_perfil = request.form['tipo_perfil']
    tipo_documento = request.form['tipo_documento']
    numero_documento = request.form['numero_documento']
    nombre = request.form['nombre']
    apellido_paterno = request.form['apellido_paterno']
    apellido_materno = request.form['apellido_materno']
    correo_electronico = request.form['correo_electronico']
    celular = request.form['celular']
    sexo = request.form['sexo']
    fecha_nacimiento = datetime.strptime(request.form['fecha_nacimiento'], '%Y-%m-%d').date()
    clave_asignada = request.form['clave_asignada']

    # Hashear la contraseña antes de guardarla
    clave_asignada_hashed = hash_password(clave_asignada)

    nuevo_registro = NuevoRegistro(
        tipo_perfil=tipo_perfil,
        tipo_documento=tipo_documento,
        numero_documento=numero_documento,
        nombre=nombre,
        apellido_paterno=apellido_paterno,
        apellido_materno=apellido_materno,
        correo_electronico=correo_electronico,
        celular=celular,
        sexo=sexo,
        fecha_nacimiento=fecha_nacimiento,
        clave_asignada=clave_asignada_hashed  # Guarda la contraseña hasheada
    )

    try:
        db.session.add(nuevo_registro)
        db.session.commit()
        print("Registro exitoso")
        mensaje = "Usuario registrado."
    except Exception as e:
        print(f"Error al registrar: {str(e)}")
        mensaje = "Error al registrar."

    return mensaje

@routes_blueprint.route('/cargar_registro_usuario', methods=['GET'])
def cargar_registro_usuario():
    return render_template('nuevo_alumno.html')

@routes_blueprint.route('/registro_usuario', methods=['POST'])
def registro_usuario():
    codigo_alumno = request.form['codigo_alumno']
    nombre = request.form['nombre']
    fecha_ingreso = datetime.strptime(request.form['fecha_ingreso'], '%Y-%m-%d').date()
    ciclo_academico = request.form['ciclo_academico']
    ultima_actualizacion_foto = datetime.strptime(request.form['ultima_actualizacion_foto'], '%Y-%m-%d').date()

    nuevo_usuario = Usuario(
        codigo_alumno=codigo_alumno,
        nombre=nombre,
        fecha_ingreso=fecha_ingreso,
        ciclo_academico=ciclo_academico,
        ultima_actualizacion_foto=ultima_actualizacion_foto
    )

    try:
        db.session.add(nuevo_usuario)
        db.session.commit()
        mensaje = "Usuario registrado."
    except Exception as e:
        mensaje = "Error al registrar."

    return mensaje


@routes_blueprint.route('/login', methods=['POST'])
def login():
    dni = request.form['usuario'].upper()
    clave_ingresada = request.form['contrasena']
    rol_seleccionado = request.form['rol']  # Obtiene el rol seleccionado de los datos del formulario.
    #recaptcha_response = request.form.get('g-recaptcha-response')  # Obtén la respuesta del reCAPTCHA

    # Obtener el usuario a partir del DNI ingresado
    usuario = db.session.query(NuevoRegistro).filter(NuevoRegistro.numero_documento == dni).first()

    # Verificar si el usuario existe y si la contraseña ingresada es correcta
    if usuario and check_password(usuario.clave_asignada, clave_ingresada):
        # Aquí se agrega la verificación del rol
        if usuario.tipo_perfil == rol_seleccionado:
            # Si el usuario es un administrador, verifica el reCAPTCHA
            #if rol_seleccionado == "Administrador" and not verify_recaptcha(recaptcha_response):
            #    response = jsonify({'message': 'reCAPTCHA no verificado. Por favor, inténtelo de nuevo.'})
            #    response.status_code = 400
            #    return response
            # Iniciar la sesión del usuario
            session['logged_in'] = True
            session['usuario_id'] = usuario.id
            session['rol'] = usuario.tipo_perfil
            session['nombre_usuario'] = usuario.nombre  # Agregar esta línea para almacenar el nombre del usuario en la sesión

            # Agrega este print para mostrar el ID de la sesión
            print("ID de la sesión:", session.get('usuario_id'))

            # Imprimir los valores relevantes
            print("DNI:", dni)
            print("Contraseña ingresada:", clave_ingresada)
            print("Contraseña almacenada:", usuario.clave_asignada)

            response = jsonify({'message': 'Inicio de sesión exitoso', 'rol': usuario.tipo_perfil})
            response.status_code = 200
            return response
        else:
            response = jsonify({'message': 'El rol seleccionado no coincide con las credenciales proporcionadas.'})
            response.status_code = 401
            return response
    else:
        response = jsonify({'message': 'Inicio de sesión fallido. Por favor verifique su DNI y contraseña.'})
        response.status_code = 401
        return response

@routes_blueprint.route('/logout')
def logout():
    # Eliminar las variables de sesión
    session.pop('logged_in', None)
    session.pop('usuario_id', None)
    session.pop('rol', None)
    session.pop('nombre_usuario', None)

    # Redirigir al template principal
    return redirect('/main')

@routes_blueprint.route('/set-rol', methods=['POST'])
def set_rol():
    rol_seleccionado = request.form['rol']
    session['rol_seleccionado'] = rol_seleccionado
    return jsonify({'message': 'Rol seleccionado establecido'}), 200


@routes_blueprint.route('/datos_usuario', methods=['GET'])
def datos_usuario():
    # Asumiendo que guardaste el rol en la sesión como 'rol_seleccionado'
    rol_seleccionado = session.get('rol')

    # Imprime el rol para depuración
    print("Rol en la sesión:", rol_seleccionado)

    if not rol_seleccionado:
        return f"No se encontró el rol en la sesión.", 400

    if rol_seleccionado == "Administrador":
        # Para el perfil de administrador, simplemente renderizar el template que permite buscar por DNI
        return render_template('updated_usuario.html', usuario=None)
    else:
        # Para otros perfiles, tomar el ID del usuario desde la sesión
        usuario_id = session.get('usuario_id')
        print(f"ID del usuario desde la sesión: {usuario_id}")
        usuario = NuevoRegistro.query.get(usuario_id)

        if not usuario:
            return "Usuario no encontrado", 404

        # Mapear roles a plantillas
        templates_map = {
            'Personal administrativo': 'view_usuario.html',
            'Docente': 'view_usuario.html'
        }

        template_name = templates_map.get(rol_seleccionado)

        if not template_name:
            return f"Rol '{rol_seleccionado}' no reconocido.", 400

        return render_template(template_name, usuario=usuario)

@routes_blueprint.route('/actualizar_usuario', methods=['POST'])
def actualizar_usuario():
    data = request.json
    usuario_id = session.get('usuario_id')
    usuario = NuevoRegistro.query.get(usuario_id)

    if not usuario:
        return jsonify(success=False, message="Usuario no encontrado"), 404

    field_to_update = data['field']
    new_value = data['value']

    # If the field to update is the password, hash it before saving
    if field_to_update == "clave_asignada":
        new_value = generate_password_hash(new_value)

    setattr(usuario, field_to_update, new_value)

    try:
        db.session.commit()
        return jsonify(success=True, message="Actualizado con éxito")
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, message=f"Error al actualizar: {str(e)}")

@routes_blueprint.route('/recover_password', methods=['GET'])
def recover_password_form():
    return render_template('recuperar.html')

@routes_blueprint.route('/generar_pin', methods=['POST'])
def generar_pin():
    data = request.json
    correo = data.get('correo')
    if not correo:
        return jsonify(success=False, message="Correo no proporcionado"), 400

    # Generar PIN
    pin = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    session['pin'] = pin
    # para luego compararlo cuando el usuario intente actualizar su contraseña.

    # Enviar PIN por correo
    try:
        enviar_correo(correo, "Tu PIN de validación", f"Tu PIN de validación es: {pin}")
        return jsonify(success=True, message="PIN enviado con éxito")
    except Exception as e:
        return jsonify(success=False, message=f"Error al enviar el PIN: {str(e)}")


@routes_blueprint.route('/actualizar_contraseña', methods=['POST'])
def actualizar_contraseña():
    # Asegurarse de que el usuario esté autenticado
    usuario_id = session.get('usuario_id')
    if not usuario_id:
        return jsonify({"error": "Usuario no autenticado"}), 401

    # Obtener la nueva contraseña y la confirmación desde el cuerpo de la solicitud
    data = request.json
    nueva_contraseña = data.get('nueva_contraseña')
    confirmacion_contraseña = data.get('confirmacion_contraseña')

    # Verificar que las contraseñas coincidan
    if nueva_contraseña != confirmacion_contraseña:
        return jsonify({"error": "Las contraseñas no coinciden"}), 400

    # Buscar el usuario en la base de datos
    usuario = NuevoRegistro.query.get(usuario_id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # Actualizar la contraseña del usuario y guardar en la base de datos
    usuario.clave_asignada = generate_password_hash(nueva_contraseña)
    db.session.commit()

    return jsonify({"message": "Contraseña actualizada con éxito"}), 200

@routes_blueprint.route('/update_usuario', methods=['POST'])
def update_usuario():
    data = request.form
    usuario = NuevoRegistro.query.filter_by(numero_documento=data.get('dni')).first()

    if usuario:
        if data.get('correo_electronico'):
            usuario.correo_electronico = data.get('correo_electronico')
        if data.get('celular'):
            usuario.celular = data.get('celular')

        db.session.commit()  # Asegúrate de que estás usando SQLAlchemy y que db.session está disponible
        return jsonify({'message': 'Datos actualizados correctamente'}), 200
    else:
        return jsonify({'error': 'Usuario no encontrado'}), 404


@routes_blueprint.route('/obtener_docentes', methods=['GET'])
def obtener_docentes():
    docentes = NuevoRegistro.query.filter_by(tipo_perfil='Docente').all()
    docentes_list = [{"id": docente.id, "nombre": docente.nombre} for docente in docentes]
    return jsonify(docentes_list)

@routes_blueprint.route('/obtener_secciones', methods=['GET'])
def obtener_secciones():
    docente_id = session.get('usuario_id')  # Obtén el ID del docente de la sesión
    print("ID del docente:", docente_id)

    # Realiza la consulta en la base de datos para obtener las secciones del docente actual
    secciones = db.session.query(Secciones).join(profesor_seccion).filter(profesor_seccion.c.profesor_id == docente_id).all()
    #esto se cambia con la base de datos
    #secciones = db.session.query(Secciones).join(profesor_seccion)\
    #    .filter(profesor_seccion.c.profesor_id == docente_id, Secciones.tipo_seccion == 'laboratorio').all()

    # Crea una lista de diccionarios con los datos de las secciones
    secciones_list = [{"id": seccion.id, "nombre_seccion": seccion.nombre_seccion} for seccion in secciones]
    # esto se cambia con la base de datos
    #secciones_list = [{"id": seccion.id, "nombre_seccion": seccion.nombre_seccion, "tipo_seccion": seccion.tipo_seccion} for seccion in secciones]


    print("Secciones obtenidas:", secciones_list)

    return jsonify(secciones_list)

@routes_blueprint.route('/obtener_secciones_alumnos', methods=['GET'])
def obtener_secciones_alumnos():
    # Consultar todas las secciones en la base de datos
    secciones = db.session.query(Secciones).all()

    # Convertir las secciones a un formato serializable
    secciones_dict = [seccion.to_dict() for seccion in secciones]

    # Devolver las secciones como respuesta JSON
    return jsonify(secciones_dict), 200

@routes_blueprint.route('/asignar_docente', methods=['POST'])
def asignar_docente():
    profesor_id = request.form.get('profesor_id')
    seccion_id = request.form.get('seccion_id')

    profesor = NuevoRegistro.query.get(profesor_id)
    seccion = Secciones.query.get(seccion_id)

    profesor.secciones.append(seccion)
    db.session.commit()

    return jsonify({"message": "Asignación exitosa"}), 200

@routes_blueprint.route('/obtener_docentes_asignados', methods=['GET'])
def obtener_docentes_asignados():
    docentes_asignados = [relacion.profesor_id for relacion in db.session.query(profesor_seccion.c.profesor_id).distinct()]
    return jsonify(docentes_asignados)

###### valida las secciones para el docente
@routes_blueprint.route('/obtener_secciones_no_asignadas', methods=['GET'])
def obtener_secciones_no_asignadas():
    secciones_asignadas = [relacion.seccion_id for relacion in db.session.query(profesor_seccion.c.seccion_id).distinct()]
    secciones_no_asignadas = Secciones.query.filter(~Secciones.id.in_(secciones_asignadas)).all()
    secciones_list = [{"id": seccion.id, "nombre_seccion": seccion.nombre_seccion} for seccion in secciones_no_asignadas]
    print(secciones_asignadas)
    # Imprime el nombre de las secciones
    for seccion_no_asignada in secciones_no_asignadas:
        print(seccion_no_asignada.nombre_seccion)
        for seccion_asignada in secciones_asignadas:
            print(seccion_asignada)

    return jsonify(secciones_list)

####### valida las secciones para estudiantes
@routes_blueprint.route('/obtener_secciones_noasignadas', methods=['GET'])
def obtener_secciones_noasignadas():
    secciones_asignadas = [relacion.seccion_id for relacion in
                           db.session.query(estudiante_seccion.c.seccion_id).distinct()]
    secciones_no_asignadas = Secciones.query.filter(~Secciones.id.in_(secciones_asignadas)).all()
    secciones_list = [{"id": seccion.id, "nombre_seccion": seccion.nombre_seccion} for seccion in
                      secciones_no_asignadas]

    # Imprime el nombre de las secciones
    for seccion in secciones_no_asignadas:
        print(seccion.nombre_seccion)

    return jsonify(secciones_list)

@routes_blueprint.route('/asignar_estudiante', methods=['POST'])
def asignar_estudiante():
    estudiante_id = request.form.get('estudiante_id')
    seccion_id_list = json.loads(request.form.get('seccion_id'))

    for seccion_id in seccion_id_list:
        # Verificación de la cantidad máxima de estudiantes en una sección
        asignaciones_existentes = db.session.query(estudiante_seccion).filter_by(seccion_id=seccion_id).count()
        if asignaciones_existentes >= 30:
            return jsonify({"message": f"La sección {seccion_id} ya tiene el máximo de estudiantes permitidos (30).", "status": "error"})

        asignacion = estudiante_seccion.insert().values(estudiante_id=estudiante_id, seccion_id=seccion_id)
        db.session.execute(asignacion)

    db.session.commit()

    return jsonify({"message": "Estudiante asignado correctamente.", "status": "success"})


@routes_blueprint.route('/obtener_usuarios', methods=['GET'])
def obtener_usuarios():
    usuarios = Usuario.query.all()
    usuarios_list = [{"id": usuario.id, "nombre": usuario.nombre} for usuario in usuarios]
    #print(usuarios_list)
    return jsonify(usuarios_list)

@routes_blueprint.route('/obtener_estudiantes_asignados', methods=['GET'])
def obtener_usuarios_asignados():
    usuarios_asignados = [relacion.estudiante_id for relacion in db.session.query(estudiante_seccion.c.estudiante_id).distinct()]
    return jsonify(usuarios_asignados)

@routes_blueprint.route('/get_attendance_data', methods=['GET'])
def get_attendance_data():
    # Obtener los datos de asistencia actualizados
    nombre, codigo_alumno, hora = extract_attendance_from_db()

    # Renderizar la tabla de asistencia en un template HTML
    return render_template('attendance_table.html', nombre=nombre, codigo_alumno=codigo_alumno, hora=hora)

@routes_blueprint.route('/search_student', methods=['POST'])
def search_student():
    codigo_alumno = request.form['codigo_alumno']

    # Realiza la búsqueda del usuario
    usuario = Usuario.query.filter_by(codigo_alumno=codigo_alumno).first()

    pertenece_aula = False
    ultima_asistencia = None  # Nueva variable para almacenar la última asistencia del alumno
    ruta_imagen = ""  # Nueva variable para almacenar la ruta de la imagen
    primer_archivo = None  # Inicializar la variable con None

    if usuario:
        pertenece_aula = True
        # Busca el último registro de asistencia para el alumno
        ultima_asistencia = AsistenciaAula.query.filter_by(usuario_id=usuario.id).order_by(AsistenciaAula.fecha.desc(), AsistenciaAula.hora.desc()).first()

        # Intenta obtener la ruta de la imagen
        try:
            # Ruta del directorio del rostro
            ruta_directorio = os.path.join('static', 'faces', codigo_alumno)
            print(f"ruta_directorio: {ruta_directorio}")  # Imprime la ruta del directorio
            # Buscar el primer archivo en el directorio
            primer_archivo = next(os.scandir(ruta_directorio), None)
            print(f"primer_archivo: {primer_archivo}")  # Imprime el primer archivo
            # Comprueba si el archivo existe
            if primer_archivo is not None:
                # Construye la ruta completa del archivo
                ruta_imagen = os.path.join(ruta_directorio, primer_archivo.name)
                print(f"ruta_imagen: {ruta_imagen}")  # Imprime la ruta de la imagen
        except FileNotFoundError:
            print("No se encontró el directorio del rostro para el alumno.")

    return render_template('search_student.html', usuario=usuario, pertenece_aula=pertenece_aula,
                           ruta_imagen=ruta_imagen, primer_archivo=primer_archivo.name if primer_archivo else None, ultima_asistencia=ultima_asistencia)
@routes_blueprint.route('/search_student_aula', methods=['POST'])
def search_student_aula():
    codigo_alumno = request.form['codigo_alumno']
    seccion_id = request.form['seccion']

    # Realiza la búsqueda del usuario y verifica si pertenece a la sección
    usuario = Usuario.query.filter_by(codigo_alumno=codigo_alumno).first()
    seccion_obj = Secciones.query.filter_by(id=seccion_id).first()

    pertenece_aula = False
    pertenece_seccion = False
    ultima_asistencia = None  # Nueva variable para almacenar la última asistencia del alumno
    ruta_imagen = ""  # Nueva variable para almacenar la ruta de la imagen
    primer_archivo = None  # Inicializar la variable con None

    if usuario and seccion_obj:
        pertenece_aula = True

        if seccion_obj in usuario.secciones:
            pertenece_seccion = True
            print(f"Código de Alumno: {codigo_alumno}")
            print(f"Sección: {seccion_obj.nombre_seccion}")

            # Busca el último registro de asistencia para el alumno
            ultima_asistencia = AsistenciaAula.query.filter_by(usuario_id=usuario.id).order_by(
                AsistenciaAula.fecha.desc(), AsistenciaAula.hora.desc()).first()

            # Intenta obtener la ruta de la imagen
            try:
                # Ruta del directorio del rostro
                ruta_directorio = os.path.join('static', 'faces', codigo_alumno)
                print(f"ruta_directorio: {ruta_directorio}")  # Imprime la ruta del directorio
                # Buscar el primer archivo en el directorio
                primer_archivo = next(os.scandir(ruta_directorio), None)
                print(f"primer_archivo: {primer_archivo}")  # Imprime el primer archivo
                # Comprueba si el archivo existe
                if primer_archivo is not None:
                    # Construye la ruta completa del archivo
                    ruta_imagen = os.path.join(ruta_directorio, primer_archivo.name)
                    print(f"ruta_imagen: {ruta_imagen}")  # Imprime la ruta de la imagen
            except FileNotFoundError:
                print("No se encontró el directorio del rostro para el alumno.")

    return render_template('resultados_busqueda.html', usuario=usuario, pertenece_aula=pertenece_aula,
                           pertenece_seccion=pertenece_seccion, seccion=seccion_obj.nombre_seccion,
                           ruta_imagen=ruta_imagen, primer_archivo=primer_archivo.name if primer_archivo else None,
                           ultima_asistencia=ultima_asistencia)

@routes_blueprint.route('/search_student_laboratorio', methods=['POST'])
def search_student_laboratorio():
    codigo_alumno = request.form['codigo_alumno']
    seccion_id = request.form['seccion']

    usuario = Usuario.query.filter_by(codigo_alumno=codigo_alumno).first()
    seccion_obj = Secciones.query.filter_by(id=seccion_id).first()

    pertenece_laboratorio = False
    pertenece_seccion = False
    ultima_asistencia = None
    ruta_imagen = ""
    primer_archivo = None

    if usuario and seccion_obj:
        pertenece_laboratorio = True
        print(f"Código de Alumno: {codigo_alumno}")

        if seccion_obj in usuario.secciones:
            pertenece_seccion = True
            print(f"Código de Alumno: {codigo_alumno}")
            print(f"Sección: {seccion_obj.nombre_seccion}")

            ultima_asistencia = AsistenciaLaboratorio.query.filter_by(usuario_id=usuario.id).order_by(
                AsistenciaLaboratorio.fecha.desc(), AsistenciaLaboratorio.hora.desc()).first()

            try:
                ruta_directorio = os.path.join('static', 'faces', codigo_alumno)
                primer_archivo = next(os.scandir(ruta_directorio), None)
                if primer_archivo is not None:
                    ruta_imagen = os.path.join(ruta_directorio, primer_archivo.name)
            except FileNotFoundError:
                print("No se encontró el directorio del rostro para el alumno.")

    return render_template('resultados_busqueda.html', usuario=usuario, pertenece_laboratorio=pertenece_laboratorio,
                           pertenece_seccion=pertenece_seccion, ruta_imagen=ruta_imagen, primer_archivo=primer_archivo.name if primer_archivo else None,
                           ultima_asistencia=ultima_asistencia)

@routes_blueprint.route('/search_student_unificado', methods=['POST'])
def search_student_unificado():
    codigo_alumno = request.form['codigo_alumno']
    seccion_id = request.form['seccion']

    # Busca el usuario y la sección
    usuario = Usuario.query.filter_by(codigo_alumno=codigo_alumno).first()
    seccion_obj = Secciones.query.filter_by(id=seccion_id).first()

    # Información de Aula
    pertenece_aula = False
    pertenece_seccion_aula = False
    ultima_asistencia_aula = None
    ruta_imagen = ""
    primer_archivo = None

    # Información de Laboratorio
    pertenece_laboratorio = False
    pertenece_seccion_laboratorio = False
    ultima_asistencia_laboratorio = None

    if usuario and seccion_obj:
        pertenece_aula = True
        pertenece_laboratorio = True
        tipo_seccion = seccion_obj.tipo_seccion  # Obteniendo el tipo de sección desde la base de datos
        print("Tipo de seccion: ", tipo_seccion)
        if seccion_obj in usuario.secciones:
            pertenece_seccion_aula = True
            pertenece_seccion_laboratorio = True
            # Buscar la última asistencia en aula y laboratorio
            ultima_asistencia_aula = AsistenciaAula.query.filter_by(usuario_id=usuario.id).order_by(
                AsistenciaAula.fecha.desc(), AsistenciaAula.hora.desc()).first()
            ultima_asistencia_laboratorio = AsistenciaLaboratorio.query.filter_by(usuario_id=usuario.id).order_by(
                AsistenciaLaboratorio.fecha.desc(), AsistenciaLaboratorio.hora.desc()).first()
            # Agregar logs para verificar los resultados de las consultas
            print("Última asistencia aula:", ultima_asistencia_aula)
            print("Última asistencia laboratorio:", ultima_asistencia_laboratorio)

            try:
                ruta_directorio = os.path.join('static', 'faces', codigo_alumno)
                primer_archivo = next(os.scandir(ruta_directorio), None)
                if primer_archivo is not None:
                    ruta_imagen = os.path.join(ruta_directorio, primer_archivo.name)
            except FileNotFoundError:
                print("No se encontro el directorio del rostro para el alumno.")

    return render_template('resultados_busqueda.html',
                           usuario=usuario,
                           pertenece_aula=pertenece_aula,
                           seccion=seccion_obj.nombre_seccion if seccion_obj else None,
                           tipo_seccion=tipo_seccion,
                           pertenece_seccion_aula=pertenece_seccion_aula,
                           ultima_asistencia_aula=ultima_asistencia_aula,
                           pertenece_laboratorio=pertenece_laboratorio,
                           pertenece_seccion_laboratorio=pertenece_seccion_laboratorio,
                           ultima_asistencia_laboratorio=ultima_asistencia_laboratorio,
                           # ... y cualquier otra variable que necesites enviar
                           )


@routes_blueprint.route('/resa')
def resa():
    return render_template('resultado_asistencias.html')

@routes_blueprint.route('/resultado_asistencias', methods=['POST'])
def resultado_asistencias():
    codigo_alumno = request.form['codigo_alumno']

    usuario = Usuario.query.filter_by(codigo_alumno=codigo_alumno).first()
    if not usuario:
        return render_template('error.html', mensaje='No se encontró el estudiante con código: ' + codigo_alumno)

    asistencias_aula = AsistenciaAula.query.filter_by(usuario_id=usuario.id).all()
    asistencias_laboratorio = AsistenciaLaboratorio.query.filter_by(usuario_id=usuario.id).all()

    return render_template('resultado_asistencias.html',
                           usuario=usuario,
                           asistencias_aula=asistencias_aula,
                           asistencias_laboratorio=asistencias_laboratorio)


@routes_blueprint.route('/search_student_combined', methods=['POST'])
def search_student_combined():
    codigo_alumno = request.form['codigo_alumno']

    # Realiza la búsqueda del usuario
    usuario = Usuario.query.filter_by(codigo_alumno=codigo_alumno).first()

    # Variables iniciales
    pertenece_aula = False
    pertenece_seccion = False
    ultima_asistencia_aula = None
    ultima_asistencia_laboratorio = None  # Variable para la última asistencia en el laboratorio
    ruta_imagen = ""
    primer_archivo = None

    if usuario:
        pertenece_aula = True
        # Busca el último registro de asistencia para el alumno en aula
        ultima_asistencia_aula = AsistenciaAula.query.filter_by(usuario_id=usuario.id).order_by(
            AsistenciaAula.fecha.desc(), AsistenciaAula.hora.desc()).first()

        # Busca el último registro de asistencia para el alumno en laboratorio
        ultima_asistencia_laboratorio = AsistenciaLaboratorio.query.filter_by(usuario_id=usuario.id).order_by(
            AsistenciaLaboratorio.fecha.desc(), AsistenciaLaboratorio.hora.desc()).first()

        # Intenta obtener la ruta de la imagen
        try:
            ruta_directorio = os.path.join('static', 'faces', codigo_alumno)
            primer_archivo = next(os.scandir(ruta_directorio), None)
            if primer_archivo is not None:
                ruta_imagen = os.path.join(ruta_directorio, primer_archivo.name)
        except FileNotFoundError:
            print("No se encontró el directorio del rostro para el alumno.")

    return render_template('search_student.html', usuario=usuario, pertenece_aula=pertenece_aula,
                           ultima_asistencia_aula=ultima_asistencia_aula, ultima_asistencia_laboratorio=ultima_asistencia_laboratorio,
                           ruta_imagen=ruta_imagen, primer_archivo=primer_archivo.name if primer_archivo else None)


@routes_blueprint.route('/buscar_usuario_por_dni', methods=['POST'])
def buscar_usuario_por_dni():
    dni = request.form.get('dni')

    # Lógica para buscar al usuario en la base de datos usando el DNI
    usuario = NuevoRegistro.query.filter_by(numero_documento=dni).first()

    if usuario:
        return jsonify({
            'tipo_perfil': usuario.tipo_perfil,
            'numero_documento': usuario.numero_documento,
            'nombre': usuario.nombre,
            'apellido_paterno': usuario.apellido_paterno,
            'apellido_materno': usuario.apellido_materno,
            'correo_electronico': usuario.correo_electronico,
            'celular': usuario.celular,
            'clave_asignada': usuario.clave_asignada,
        }), 200
    else:
        return jsonify({'error': 'Usuario no encontrado'}), 404

@routes_blueprint.route('/get_students_sections', methods=['GET'])
def get_students_sections():
    estudiantes = Usuario.query.all()
    estudiantes_data = []

    for estudiante in estudiantes:
        secciones = [seccion.nombre_seccion for seccion in estudiante.secciones]
        estudiante_data = {
            'codigo_alumno': estudiante.codigo_alumno,
            'nombre': estudiante.nombre,
            'secciones': secciones
        }
        estudiantes_data.append(estudiante_data)

    return jsonify(estudiantes_data)

@routes_blueprint.route('/get_sections', methods=['GET'])
def get_sections():
    secciones = Secciones.query.all()
    secciones_data = [{'id': seccion.id, 'nombre_seccion': seccion.nombre_seccion} for seccion in secciones]
    return jsonify(secciones_data)

@routes_blueprint.route('/get_students_for_section/<int:seccionId>', methods=['GET'])
def get_students_for_section(seccionId):
    seccion = Secciones.query.get(seccionId)
    if not seccion:
        return jsonify({'message': 'Sección no encontrada'}), 404

    estudiantes = seccion.estudiantes
    estudiantes_data = [{'codigo_alumno': estudiante.codigo_alumno, 'nombre': estudiante.nombre} for estudiante in estudiantes]

    return jsonify(estudiantes_data)

@routes_blueprint.route('/get_students_failed_by_section/<int:section_id>', methods=['GET'])
def get_students_failed_by_section(section_id):
    try:
        # Consulta para obtener estudiantes jalados por inasistencia para la sección específica
        students_failed = db.session.query(
            Usuario.codigo_alumno,
            Usuario.nombre,
            estudiante_seccion.c.estado
        ).join(
            estudiante_seccion, estudiante_seccion.c.estudiante_id == Usuario.id
        ).filter(
            estudiante_seccion.c.estado == 'Jalado por Inasistencia',
            estudiante_seccion.c.seccion_id == section_id
        ).all()

        # Construir la lista de estudiantes en formato JSON
        data = []
        for index, student in enumerate(students_failed, start=1):
            data.append({
                "indice": index,
                "codigo_alumno": student.codigo_alumno,
                "nombre": student.nombre,
                "estado": student.estado
            })

        return jsonify(data)
    except Exception as e:
        # Capturar cualquier excepción y devolver un mensaje de error
        logging.exception("Ocurrió un error al obtener los estudiantes jalados por inasistencia para la sección")
        return jsonify({"error": str(e)}), 500


@routes_blueprint.route('/get_teachers_sections', methods=['GET'])
def get_teachers_sections():
    docentes = NuevoRegistro.query.filter(NuevoRegistro.tipo_perfil == 'Docente').all()
    data = []
    for docente in docentes:
        secciones = [seccion.nombre_seccion for seccion in docente.secciones]
        data.append({
            'numero_documento': docente.numero_documento,
            'nombre': docente.nombre,
            'secciones': secciones
        })
    return jsonify(data)

@routes_blueprint.route('/get_students_by_section', methods=['GET'])
def get_students_by_section():
    seccion_id = request.args.get('seccion')
    fecha = request.args.get('fecha')

    # Convertir la fecha de string a datetime
    fecha = datetime.strptime(fecha, "%Y-%m-%d")

    estudiantes = Usuario.query \
        .join(estudiante_seccion, Usuario.id == estudiante_seccion.c.estudiante_id) \
        .join(AsistenciaLaboratorio, Usuario.asistencias_laboratorio) \
        .join(AsistenciaAula, Usuario.asistencias_aula) \
        .filter(
        estudiante_seccion.c.seccion_id == seccion_id,
        or_(
            AsistenciaLaboratorio.fecha == fecha,
            AsistenciaAula.fecha == fecha
        )
    ) \
        .all()

    estudiantes_data = []
    for estudiante in estudiantes:
        estudiante_data = {
            'codigo_alumno': estudiante.codigo_alumno,
            'nombre': estudiante.nombre,
        }
        estudiantes_data.append(estudiante_data)

    return jsonify({'estudiantes': estudiantes_data})

@routes_blueprint.route('/actualizar_cubiculo', methods=['POST'])
def actualizar_cubiculo():
    codigo_alumno = request.form['codigo_alumno']
    nuevo_numero_cubiculo = request.form['nuevo_numero_cubiculo']

    # Verificar si el nuevo número de cubículo ya está en uso
    cubiculo_en_uso = AsistenciaLaboratorio.query.filter_by(numero_cubiculo=nuevo_numero_cubiculo).first()
    if cubiculo_en_uso is not None:
        response = {'success': False, 'message': 'El número de cubículo ya está en uso.'}
        return jsonify(response)

    # Realizar la actualización en la base de datos
    usuario = Usuario.query.filter_by(codigo_alumno=codigo_alumno).first()
    if usuario is not None:
        asistencia_laboratorio = AsistenciaLaboratorio.query.filter_by(usuario_id=usuario.id).first()
        if asistencia_laboratorio is not None:
            asistencia_laboratorio.numero_cubiculo = nuevo_numero_cubiculo
            db.session.commit()
            response = {'success': True}
            return jsonify(response)

    response = {'success': False}
    return jsonify(response)

@routes_blueprint.route('/limpiar_asignaciones', methods=['POST'])
def limpiarAsignaciones():
    try:
        # Eliminar todas las relaciones en la tabla profesor_seccion
        db.session.query(profesor_seccion).delete()

        # Guardar los cambios en la base de datos
        db.session.commit()

        return jsonify({"message": "Asignaciones limpiadas correctamente"}), 200
    except Exception as e:
        db.session.rollback()  # Revertir los cambios en caso de error
        return jsonify({"message": "Error al limpiar las asignaciones", "error": str(e)}), 500

@routes_blueprint.route('/limpiar_asignaciones_estudiantes', methods=['POST'])
def limpiarAsignacionesEstudiantes():
    try:
        # Eliminar todas las relaciones en la tabla profesor_seccion
        db.session.query(estudiante_seccion).delete()

        # Guardar los cambios en la base de datos
        db.session.commit()

        return jsonify({"message": "Asignaciones limpiadas correctamente"}), 200
    except Exception as e:
        db.session.rollback()  # Revertir los cambios en caso de error
        return jsonify({"message": "Error al limpiar las asignaciones", "error": str(e)}), 500

@routes_blueprint.route('/obtener_asistencia', methods=['GET'])
def obtener_asistencia():
    # Obtener el id de la sección desde los parámetros de la petición
    seccion_id = request.args.get('seccion_id', type=int)

    # Obtener la asistencia del día de hoy para la sección especificada
    today = date.today()
    asistencia = AsistenciaAula.query.filter_by(fecha=today, seccion_id=seccion_id).all()
    print(asistencia)  # Esto imprimirá los registros de asistencia en tu consola
    return jsonify([asist.to_dict() for asist in asistencia])

@routes_blueprint.route('/obtener_asistencia_labo', methods=['GET'])
def obtener_asistencia_labo():
    seccion_id = request.args.get('seccion_id', type=int)
    # Obtener la asistencia del día de hoy
    today = date.today()
    asistencia = AsistenciaLaboratorio.query.filter_by(fecha=today, seccion_id=seccion_id).all()
    print(asistencia)  # Esto imprimirá los registros de asistencia en tu consola
    return jsonify([asist.to_dict() for asist in asistencia])
@routes_blueprint.route('/validar_pin', methods=['POST'])
def validar_pin():
    data = request.json
    pin_ingresado = data.get('pin')
    if not pin_ingresado:
        return jsonify(success=False, message="PIN no proporcionado"), 400

    # Comparar el PIN ingresado con el PIN en la sesión
    if 'pin' in session and session['pin'] == pin_ingresado:
        # Si es correcto, eliminar el PIN de la sesión
        session.pop('pin')
        return jsonify(success=True, message="PIN correcto")
    else:
        return jsonify(success=False, message="PIN incorrecto"), 401

@routes_blueprint.route('/verificar_correo', methods=['POST'])
def verificar_correo():
    data = request.json
    correo = data.get('correo')

    # Suponiendo que tienes una función que verifica si un correo existe en la base de datos
    if correo_existe(correo):
        return jsonify(success=True, message="Correo existe")
    else:
        return jsonify(success=False, message="Correo no registrado"), 404

################################################################
@routes_blueprint.route('/update_student_image', methods=['POST'])
def update_student_image():
    image_data = request.form['image_data']
    codigo_alumno = request.form['codigo_alumno']

    # Decodificar la imagen
    _, encoded_image = image_data.split(",", 1)
    decoded_image = base64.b64decode(encoded_image)

    # Buscar al estudiante en la tabla usuarios
    usuario = Usuario.query.filter_by(codigo_alumno=codigo_alumno).first()

    if not usuario:
        return jsonify(success=False, message="Usuario no encontrado."), 400

    # Construir la ruta de la imagen
    image_filename = f"{codigo_alumno}_0.jpg"
    image_path = os.path.join('static', 'faces', codigo_alumno, image_filename)

    # Guardar (sobrescribir) la imagen
    try:
        with open(image_path, 'wb') as image_file:
            image_file.write(decoded_image)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 400

    # Actualizar la fecha de la última actualización en la tabla usuarios
    usuario.ultima_actualizacion_foto = datetime.now()
    db.session.commit()

    return jsonify(success=True, message="Imagen actualizada exitosamente.")

@routes_blueprint.route('/students_report')
def students_report():
    usuarios = Usuario.query.all()  # Obtener todos los usuarios
    return render_template('students_report.html', usuarios=usuarios)

@routes_blueprint.route('/generate_pdf')
def generate_pdf():
    usuarios = Usuario.query.all()  # Obtener todos los usuarios

    # Obtener el año actual
    current_year = datetime.now().year

    for usuario in usuarios:
        # Convertir la fecha de actualización de foto a un objeto datetime
        date_updated = datetime.combine(usuario.ultima_actualizacion_foto, datetime.min.time())

        # Agregar atributos adicionales al objeto usuario para determinar el estado de actualización y el estilo
        if date_updated.year == current_year:
            usuario.update_status = "Actualizado"
            usuario.update_style = "color:green"
        else:
            usuario.update_status = "Necesita actualizar"
            usuario.update_style = "color:red"

    html = render_template('students_report.html', usuarios=usuarios, pdf_generation=True)

    # Crear una instancia de pdfcrowd con tu clave de API
    client = pdfcrowd.HtmlToPdfClient('4mars', 'e3490f933b05056044eb60304de9c9af')

    # Convertir HTML a PDF y obtener el PDF como bytes
    pdf_data = client.convertString(html)

    # Devolver PDF como respuesta
    response = make_response(pdf_data)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'inline; filename=report.pdf'
    return response

@routes_blueprint.route('/generate_pdf_faces')
def generate_pdf_faces():
    rostros = RostrosNoReconocidos.query.all()  # Obtener todos los rostros no reconocidos

    html = render_template('faces_report.html', rostros=rostros)

    # Crear una instancia de pdfcrowd con tu clave de API
    client = pdfcrowd.HtmlToPdfClient('4mars', 'e3490f933b05056044eb60304de9c9af')

    # Convertir HTML a PDF y obtener el PDF como bytes
    pdf_data = client.convertString(html)

    # Devolver PDF como respuesta
    response = make_response(pdf_data)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'inline; filename=unrecognized_faces_report.pdf'
    return response

@routes_blueprint.route('/generate_csv')
def generate_csv():
    usuarios = Usuario.query.all()  # Obtener todos los usuarios

    def generate():
        data = csv.StringIO()
        csv_writer = csv.writer(data)

        # Escribir encabezados
        csv_writer.writerow(['Código de Alumno', 'Nombre', 'Última Actualización de Foto'])

        # Escribir datos de cada usuario
        for usuario in usuarios:
            csv_writer.writerow([usuario.codigo_alumno, usuario.nombre, usuario.ultima_actualizacion_foto])

        yield data.getvalue()

    response = Response(generate(), mimetype='text/csv')
    response.headers.set("Content-Disposition", "attachment", filename="report.csv")
    return response

@routes_blueprint.route('/generate_csv_faces')
def generate_csv_faces():
    rostros = RostrosNoReconocidos.query.all()  # Obtener todos los rostros no reconocidos

    def generate():
        data = csv.StringIO()
        csv_writer = csv.writer(data)

        # Escribir encabezados
        csv_writer.writerow(['ID', 'Fecha', 'Hora', 'Tipo', 'Datos'])

        # Escribir datos de cada rostro
        for rostro in rostros:
            csv_writer.writerow([rostro.id, rostro.fecha, rostro.hora, rostro.tipo, rostro.datos])

        yield data.getvalue()

    response = Response(generate(), mimetype='text/csv')
    response.headers.set("Content-Disposition", "attachment", filename="faces_report.csv")
    return response

@routes_blueprint.route('/generate_inasistencia_pdf', methods=['POST'])
def generate_inasistencia_pdf():
    try:
        # Obtén los datos de la tabla del cuerpo de la petición
        table_data = request.json.get('tableData', [])

        # Renderiza la plantilla HTML con los datos de la tabla
        html = render_template('reporte_inasistencia.html', table_data=table_data)

        # Convierte el HTML a PDF
        client = pdfcrowd.HtmlToPdfClient('4mars', 'e3490f933b05056044eb60304de9c9af')
        pdf_data = client.convertString(html)

        if not pdf_data:
            return jsonify({"error": "El PDF está vacío"}), 500

        # Construye una respuesta con el contenido del PDF
        response = Response(pdf_data, mimetype='application/pdf')
        response.headers['Content-Disposition'] = 'inline; filename=reporte_inasistencia.pdf'

        return response
    except Exception as e:
        logging.exception("Error al generar el PDF")
        return jsonify({"error": str(e)}), 500

@routes_blueprint.route('/generate_inasistencia_csv/<int:section_id>', methods=['GET'])
def generate_inasistencia_csv(section_id):
    try:
        # Realiza la misma consulta que en tu ruta existente para obtener los datos correctos.
        students_failed = db.session.query(
            Usuario.codigo_alumno,
            Usuario.nombre,
            estudiante_seccion.c.estado
        ).join(
            estudiante_seccion, estudiante_seccion.c.estudiante_id == Usuario.id
        ).filter(
            estudiante_seccion.c.estado == 'Jalado por Inasistencia',
            estudiante_seccion.c.seccion_id == section_id
        ).all()

        def generate():
            data = csv.StringIO()
            csv_writer = csv.writer(data)

            # Escribe los encabezados del CSV
            csv_writer.writerow(['Código Alumno', 'Nombre', 'Estado'])

            # Escribe cada fila de datos en el CSV
            for student in students_failed:
                csv_writer.writerow([student.codigo_alumno, student.nombre, student.estado])

            yield data.getvalue()

        response = Response(generate(), mimetype='text/csv')
        response.headers.set("Content-Disposition", "attachment", filename="reporte_inasistencia.csv")

        return response
    except Exception as e:
        logging.exception("Ocurrió un error al generar el CSV de estudiantes jalados por inasistencia")
        return jsonify({"error": str(e)}), 500

@routes_blueprint.route('/faces_report')
def faces_report():
    rostros = RostrosNoReconocidos.query.all()

    total_records = RostrosNoReconocidos.query.count()
    no_reconocido_count = RostrosNoReconocidos.query.filter_by(tipo="No Reconocido").count()
    no_pertenece_count = RostrosNoReconocidos.query.filter_by(tipo="No Pertenece").count()
    print("No reconocido count:", no_reconocido_count)
    print("No pertenece count:", no_pertenece_count)

    return render_template('faces_report.html', rostros=rostros, no_reconocido_count=no_reconocido_count,
                           no_pertenece_count=no_pertenece_count, total_records=total_records)

@routes_blueprint.route('/verify_recaptcha', methods=['POST'])
def verify_recaptcha_route():
    response = request.form.get('g-recaptcha-response')
    verification_result = verify_recaptcha(response)
    print(f"Respuesta de reCAPTCHA: {response}")
    print(f"Resultado de la verificación: {verification_result}")
    if verification_result:
        return jsonify({'success': True}), 200
    else:
        return jsonify({'success': False}), 400

@routes_blueprint.route('/get_students_failed_by_absence')
def get_students_failed_by_absence():
    try:
        # Construir la consulta para obtener estudiantes jalados por inasistencia
        students_failed = db.session.query(
            Usuario.codigo_alumno,
            Usuario.nombre,
            estudiante_seccion.c.estado  # Seleccionar la columna de estado en lugar de nombre_seccion
        ).join(
            estudiante_seccion, estudiante_seccion.c.estudiante_id == Usuario.id
        ).join(
            Secciones, Secciones.id == estudiante_seccion.c.seccion_id
        ).filter(
            estudiante_seccion.c.estado == 'Jalado por Inasistencia'
        ).all()

        # Verificar si la consulta devuelve resultados
        if not students_failed:
            return jsonify({"error": "No students found"}), 404

        # Construir la lista de datos en formato JSON con un índice numérico
        data = []
        for index, student in enumerate(students_failed, start=1):
            data.append({
                "indice": index,  # Agregar el índice numérico
                "codigo_alumno": student.codigo_alumno,
                "nombre": student.nombre,
                "estado": student.estado  # Cambiar a 'estado' en lugar de 'nombre_seccion'
            })

        return jsonify(data)
    except Exception as e:
        # Capturar cualquier excepción y devolver un mensaje de error
        logging.exception("Ocurrió un error al obtener los estudiantes jalados por inasistencia")
        return jsonify({"error": str(e)}), 500

