
export const getCertificateTemplate = () => `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado Profesional</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            text-align: center;
            padding: 20px;
            background-color: #FFFFFF;
        }
        .certificado {
            border: 15px solid #b8860b;
            padding: 50px;
            width: 900px;
            margin: auto;
            background: #FFFFFF;
            position: relative;
            box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.3);
            border-radius: 10px;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 40px;
            gap: 20px;
        }
        .logo {
            width: 150px;
            height: auto;
        }
        .title {
            text-align: center;
        }
        h1 {
            font-size: 42px;
            font-weight: bold;
            color: #b8860b;
            margin-bottom: 15px;
            text-transform: uppercase;
            text-align: center;
        }
        h2 {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin: 20px 0;
            text-align: center;
        }
        h3 {
            font-size: 24px;
            font-weight: normal;
            color: #333;
            text-align: center;
        }
        p {
            font-size: 20px;
            color: #444;
            margin: 15px 0;
            line-height: 1.5;
            text-align: center;
        }
        .descripcion {
            font-size: 18px;
            color: #666;
            margin: 25px auto;
            max-width: 80%;
            line-height: 1.6;
            text-align: center;
        }
        .firmas-container {
            display: flex;
            justify-content: space-around;
            margin-top: 60px;
            padding: 0 40px;
        }
        .firma {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            width: 300px;
            padding-top: 10px;
            position: relative;
        }
        .firma img {
            width: 200px;
            position: absolute;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
        }
        .qr-container {
            position: absolute;
            bottom: 30px;
            right: 30px;
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        .qr-container img {
            width: 120px;
            height: 120px;
            margin-bottom: 10px;
        }
        .codigo-emision {
            font-size: 14px;
            font-weight: bold;
            color: #555;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="certificado">
        <div class="header">
            <img class="logo" id="logoEmpresa" src="" alt="Logo Empresa">
            <div class="title">
                <h1>Certificado Profesional</h1>
            </div>
        </div>
        <div class="contenido">
            <p>Por medio de la presente, se certifica que:</p>
            <h2 id="nombreParticipante">[Nombre]</h2>
            <p>Ha completado exitosamente el programa:</p>
            <h3 id="curso"><strong>[Curso]</strong></h3>
            <p class="descripcion">
                Habiendo demostrado los conocimientos y competencias requeridas para su aprobación,
                cumpliendo con todos los requisitos establecidos por la institución.
            </p>
            <p>Fecha de emisión: <span id="fecha">[Fecha]</span></p>
            <div class="firmas-container">
                <div class="firma">
                    <img id="firmaDigital" src="" alt="Firma Director">
                    <p>Director Académico</p>
                </div>
                <div class="firma">
                    <img id="firmaSpeaker" src="" alt="Firma Expositor">
                    <p>Expositor</p>
                </div>
            </div>
            <div class="qr-container">
                <img id="codigoQR" src="" alt="Código QR">
                <p class="codigo-emision">Código de verificación:<br><span id="codigoEmision">[Código]</span></p>
            </div>
        </div>
    </div>
</body>
</html>`;
