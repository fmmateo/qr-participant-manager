
export const getCertificateTemplate = () => `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado Profesional</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap');
        
        body {
            font-family: 'Cormorant Garamond', serif;
            text-align: center;
            padding: 20px;
            background-color: #FFFFFF;
            margin: 0;
        }
        .certificado {
            border: 20px solid #c9a227;
            padding: 40px;
            width: 800px;
            margin: auto;
            background: #FFFFFF;
            position: relative;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
            background-image: 
                radial-gradient(circle at 10px 10px, rgba(201, 162, 39, 0.05) 1px, transparent 1px),
                radial-gradient(circle at 20px 20px, rgba(201, 162, 39, 0.05) 1px, transparent 1px);
            background-size: 30px 30px;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 50px;
            padding: 0 20px;
        }
        .logo {
            width: 140px;
            height: auto;
            object-fit: contain;
        }
        .title {
            text-align: center;
            flex-grow: 1;
            padding: 0 20px;
        }
        h1 {
            font-size: 48px;
            font-weight: 700;
            color: #c9a227;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
            line-height: 1.2;
            text-align: center;
        }
        h2 {
            font-size: 36px;
            font-weight: 600;
            color: #2c3e50;
            margin: 20px 0;
            text-align: center;
        }
        h3 {
            font-size: 28px;
            font-weight: normal;
            color: #34495e;
            margin: 15px 0;
            text-align: center;
        }
        p {
            font-size: 22px;
            color: #34495e;
            margin: 15px 0;
            line-height: 1.5;
            text-align: center;
        }
        .descripcion {
            font-size: 20px;
            color: #34495e;
            margin: 30px auto;
            max-width: 80%;
            line-height: 1.6;
            text-align: center;
        }
        .firmas-container {
            display: flex;
            justify-content: space-around;
            margin-top: 60px;
            padding: 20px 40px;
            gap: 80px;
        }
        .firma {
            text-align: center;
            width: 250px;
            position: relative;
            margin-top: 30px;
        }
        .firma img {
            width: 180px;
            height: 80px;
            object-fit: contain;
            margin-bottom: 10px;
        }
        .firma-linea {
            border-top: 2px solid #2c3e50;
            margin: 10px auto;
            width: 100%;
        }
        .firma-nombre {
            font-size: 20px;
            font-weight: 600;
            margin: 5px 0;
            color: #2c3e50;
        }
        .firma-cargo {
            font-size: 18px;
            color: #34495e;
            margin: 5px 0;
        }
        .fecha {
            margin: 30px 0;
            font-size: 20px;
            color: #34495e;
        }
        .qr-container {
            position: absolute;
            bottom: 30px;
            right: 30px;
            text-align: right;
        }
        .qr-container img {
            width: 100px;
            height: 100px;
            margin-bottom: 10px;
        }
        .codigo-emision {
            font-size: 14px;
            color: #34495e;
            text-align: right;
        }
        .sello {
            position: absolute;
            bottom: 50px;
            left: 50px;
            opacity: 0.2;
            width: 120px;
            height: 120px;
        }
    </style>
</head>
<body>
    <div class="certificado">
        <div class="header">
            <img class="logo" id="logoEmpresa" src="" alt="Logo Empresa">
            <div class="title">
                <h1>Certificado</h1>
                <h3>de Reconocimiento</h3>
            </div>
        </div>
        <div class="contenido">
            <p>Se certifica que:</p>
            <h2 id="nombreParticipante">[Nombre del Participante]</h2>
            <p>Ha completado satisfactoriamente el programa:</p>
            <h3 id="curso">[Nombre del Programa]</h3>
            <p class="descripcion">
                Habiendo demostrado excelencia académica y compromiso, cumpliendo 
                satisfactoriamente con todos los requisitos establecidos por la institución.
            </p>
            <p class="fecha">
                Fecha de emisión: <span id="fecha">[Fecha]</span>
            </p>
            <div class="firmas-container">
                <div class="firma">
                    <img id="firmaDigital" src="" alt="Firma Director">
                    <div class="firma-linea"></div>
                    <p class="firma-nombre" id="nombreDirector">[Nombre del Director]</p>
                    <p class="firma-cargo">Director Académico</p>
                </div>
                <div class="firma">
                    <img id="firmaSpeaker" src="" alt="Firma Expositor">
                    <div class="firma-linea"></div>
                    <p class="firma-nombre" id="nombreExpositor">[Nombre del Expositor]</p>
                    <p class="firma-cargo">Expositor Principal</p>
                </div>
            </div>
            <div class="qr-container">
                <img id="codigoQR" src="" alt="Código QR">
                <p class="codigo-emision">
                    Código de verificación:<br>
                    <span id="codigoEmision">[Código]</span>
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
