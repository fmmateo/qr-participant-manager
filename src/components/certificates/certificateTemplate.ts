
export const getCertificateTemplate = () => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificado</title>
    <style>
        @page {
            margin: 0;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }
        .container {
            width: 1056px;
            height: 816px;
            position: relative;
            margin: 0 auto;
            background-color: #fff;
        }
        .header {
            text-align: center;
            padding-top: 50px;
        }
        .logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 20px;
        }
        .main-content {
            text-align: center;
            padding: 20px 80px;
        }
        .certificate-title {
            font-size: 48px;
            color: #2c3e50;
            margin-bottom: 40px;
            text-transform: uppercase;
        }
        .recipient-name {
            font-size: 36px;
            color: #34495e;
            margin: 30px 0;
            font-weight: bold;
        }
        .program-name {
            font-size: 24px;
            color: #2c3e50;
            margin: 20px 0;
        }
        .description {
            font-size: 18px;
            color: #34495e;
            margin: 30px 0;
            padding: 0 100px;
        }
        .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 80px;
            padding: 0 100px;
        }
        .signature {
            text-align: center;
            width: 250px;
        }
        .signature img {
            width: 150px;
            height: auto;
            margin-bottom: 10px;
        }
        .signature-line {
            width: 100%;
            border-top: 1px solid #000;
            margin: 10px 0;
        }
        .signer-name {
            font-size: 18px;
            color: #2c3e50;
            margin: 5px 0;
        }
        .signer-title {
            font-size: 16px;
            color: #7f8c8d;
        }
        .footer {
            position: absolute;
            bottom: 50px;
            width: 100%;
            text-align: center;
            color: #7f8c8d;
        }
        .issue-date {
            font-size: 16px;
        }
        .verification {
            position: absolute;
            bottom: 30px;
            right: 30px;
            text-align: right;
            font-size: 12px;
            color: #95a5a6;
        }
        .qr-code {
            width: 100px;
            height: 100px;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img id="logoEmpresa" class="logo" src="" alt="Logo">
            <h1 class="certificate-title">Certificado</h1>
        </div>
        <div class="main-content">
            <p>Se certifica que:</p>
            <h2 id="nombreParticipante" class="recipient-name">[Nombre del Participante]</h2>
            <p>Ha completado satisfactoriamente:</p>
            <h3 id="curso" class="program-name">[Nombre del Programa]</h3>
            <p class="description">
                Por haber culminado satisfactoriamente el programa académico, demostrando 
                dedicación y compromiso en el desarrollo de las actividades.
            </p>
            <div class="signatures">
                <div class="signature">
                    <img id="firmaDigital" src="" alt="Firma Director">
                    <div class="signature-line"></div>
                    <p id="nombreDirector" class="signer-name">[Nombre del Director]</p>
                    <p class="signer-title">Director Académico</p>
                </div>
                <div class="signature">
                    <img id="firmaSpeaker" src="" alt="Firma Expositor">
                    <div class="signature-line"></div>
                    <p id="nombreExpositor" class="signer-name">[Nombre del Expositor]</p>
                    <p class="signer-title">Expositor Principal</p>
                </div>
            </div>
        </div>
        <div class="footer">
            <p id="fecha" class="issue-date">Lima, [Fecha]</p>
        </div>
        <div class="verification">
            <img id="codigoQR" class="qr-code" src="" alt="QR Code">
            <p>Código de verificación:<br><span id="codigoEmision">[Código]</span></p>
        </div>
    </div>
</body>
</html>`;
