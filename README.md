
# Sistema de Reconocimiento Facial para Gestión de Asistencia en Universidades


Este proyecto utiliza inteligencia artificial y tecnología de reconocimiento facial para gestionar la asistencia en aulas y laboratorios universitarios, evitando la suplantación de identidad en clases, clases especiales, exámenes y registros de asistencia.

## Tabla de Contenidos
- [Instalación](#instalación)
- [Uso](#uso)
- [Características](#características)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Contribuir](#contribuir)
- [Licencia](#licencia)
- [Contacto](#contacto)

## Instalación

Para instalar y configurar el proyecto localmente, sigue estos pasos:

```bash
git clone https://github.com/ricardCortez/Proyecto_Tesis
cd nombre_del_proyecto
pip install -r requirements.txt
```

## Uso

Para iniciar el sistema, usa el siguiente comando:

```bash
python app.py
```

Puedes acceder al sistema a través de `http://localhost:5000`.

## Características

- [x] Captura, entrenamiento y reconocimiento de rostros usando OpenCV, LBPH y Haar Cascade.
- [x] Gestión de asistencia para aulas y laboratorios.
- [x] Registro de códigos de alumnos, fechas, secciones y tipos de aulas.
- [x] Asignación aleatoria de cubículos en laboratorios.
- [x] Validación de porcentaje de confiabilidad del rostro.
- [x] Subida y descarga de registros de alumnos.
- [x] Autenticación con Google Captcha y PIN de seguridad para restablecer contraseñas.

## Tecnologías Utilizadas

- **Python 3.8.x**
- **OpenCV-Python 4.7.0**
- **OpenCV-Contrib-Python 4.7.0**
- **OpenCV-Python-Headless 4.7.0**
- **Numpy**
- **SQLAlchemy**
- **Flask-SQLAlchemy**
- **PostgreSQL**
- **Flask**
- **JavaScript**

## Contribuir

Si deseas contribuir al proyecto, sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza los cambios y haz commit (`git commit -m 'Añadir nueva funcionalidad'`).
4. Sube tus cambios (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Licencia

Este proyecto está bajo la licencia MIT - mira el archivo [LICENSE](LICENSE) para más detalles.

## Contacto

Tu Nombre - [@4mars](https://x.com/_4mars)

Enlace al Proyecto: [https://github.com/ricardCortez/Proyecto_Tesis](https://github.com/ricardCortez/Proyecto_Tesis)
