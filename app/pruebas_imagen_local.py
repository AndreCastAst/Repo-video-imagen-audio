"""Arrancar panel aislado: python -m app.pruebas_imagen_local"""
from flask import Flask
from .imagen_pruebas import imagen_bp
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 7 * 1024 * 1024
app.register_blueprint(imagen_bp)
if __name__ == '__main__':
    app.run(host='127.0.0.1',port=5051,debug=False,threaded=False)
