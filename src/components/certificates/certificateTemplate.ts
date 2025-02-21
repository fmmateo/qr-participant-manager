
export const getCertificateTemplate = () => `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            text-align: center;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .certificado {
            border: 15px solid #b8860b;
            padding: 50px;
            width: 900px;
            margin: auto;
            background: white;
            position: relative;
            box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.3);
            border-radius: 10px;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin-bottom: 20px;
        }
        .logo {
            width: 120px;
            margin-right: 20px;
        }
        .title {
            flex-grow: 1;
            text-align: center;
        }
        h1 {
            font-size: 40px;
            font-weight: bold;
            color: #b8860b;
            margin-bottom: 10px;
        }
        h2 {
            font-size: 28px;
            font-weight: bold;
        }
        h3 {
            font-size: 22px;
            font-weight: normal;
            color: #333;
        }
        p {
            font-size: 18px;
            color: #444;
            margin: 10px 0;
        }
        .firma {
            margin-top: 50px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            width: 300px;
            margin: 50px auto 0;
            padding-top: 5px;
            position: relative;
        }
        .firma img {
            width: 200px;
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
        }
        .qr-container {
            position: absolute;
            bottom: 20px;
            right: 20px;
            text-align: center;
        }
        .qr-container img {
            width: 120px;
            height: 120px;
        }
        .codigo-emision {
            font-size: 14px;
            font-weight: bold;
            color: #555;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="certificado">
        <div class="header">
            <img class="logo" id="logoEmpresa" src="" alt="Logo Empresa">
            <div class="title">
                <h1>Certificado de Participación</h1>
            </div>
        </div>
        <p>Este certificado se otorga a:</p>
        <h2 id="nombreParticipante">[Nombre]</h2>
        <p>Por su destacada participación en el curso:</p>
        <h3 id="curso"><strong>[Curso]</strong></h3>
        <p>Fecha de emisión: <span id="fecha">[Fecha]</span></p>
        <div class="firma">
            <img id="firmaDigital" src="" alt="Firma Digital">
            Firma del Instructor
        </div>
        <div class="qr-container">
            <img id="codigoQR" src="" alt="Código QR">
            <p class="codigo-emision">Código de emisión: <span id="codigoEmision">[Código]</span></p>
        </div>
    </div>
</body>
</html>`;
