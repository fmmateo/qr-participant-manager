
export const getCertificateTemplate = () => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificado</title>
    <style>
        body {
            width: 29.7cm;
            height: 21cm;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: #fff;
            -webkit-print-color-adjust: exact;
        }
        .certificate-container {
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            background: #fff;
            position: relative;
        }
        .header {
            text-align: center;
            padding: 40px 0 20px 0;
        }
        .logo {
            max-width: 200px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 48px;
            color: #000;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 4px;
            font-weight: bold;
        }
        .content {
            margin: 0 auto;
            text-align: center;
            padding: 20px 60px;
        }
        .intro-text {
            font-size: 24px;
            margin: 30px 0;
        }
        .name {
            font-size: 36px;
            color: #000;
            margin: 30px 0;
            font-weight: bold;
            text-transform: uppercase;
        }
        .course-name {
            font-size: 28px;
            margin: 30px 0;
            color: #000;
        }
        .description {
            font-size: 20px;
            margin: 40px auto;
            max-width: 800px;
            line-height: 1.6;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin: 60px 120px 40px 120px;
        }
        .signature {
            text-align: center;
            width: 300px;
        }
        .signature-img {
            width: 200px;
            height: 80px;
            margin-bottom: 10px;
            object-fit: contain;
        }
        .signature-line {
            width: 100%;
            border-top: 2px solid #000;
            margin: 10px 0;
        }
        .signature-name {
            font-size: 18px;
            margin: 5px 0;
            font-weight: bold;
        }
        .signature-title {
            font-size: 16px;
            color: #666;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 18px;
        }
        .verification {
            position: absolute;
            bottom: 40px;
            right: 40px;
            text-align: right;
        }
        .qr-code {
            width: 100px;
            height: 100px;
            margin-bottom: 5px;
        }
        .verification-text {
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="header">
            <img id="logoEmpresa" class="logo" src="" alt="Logo">
            <h1 class="title">Certificado</h1>
        </div>
        <div class="content">
            <p class="intro-text">Se certifica que:</p>
            <h2 id="nombreParticipante" class="name">[Nombre del Participante]</h2>
            <p class="intro-text">Ha completado satisfactoriamente:</p>
            <h3 id="curso" class="course-name">[Nombre del Programa]</h3>
            <p class="description">
                Por haber culminado satisfactoriamente el programa académico, demostrando 
                dedicación y compromiso en el desarrollo de las actividades.
            </p>
        </div>
        <div class="signatures">
            <div class="signature">
                <img id="firmaDigital" class="signature-img" src="" alt="Firma Director">
                <div class="signature-line"></div>
                <p id="nombreDirector" class="signature-name">[Nombre del Director]</p>
                <p class="signature-title">Director Académico</p>
            </div>
            <div class="signature">
                <img id="firmaSpeaker" class="signature-img" src="" alt="Firma Expositor">
                <div class="signature-line"></div>
                <p id="nombreExpositor" class="signature-name">[Nombre del Expositor]</p>
                <p class="signature-title">Expositor Principal</p>
            </div>
        </div>
        <div class="footer">
            <p id="fecha">Lima, [Fecha]</p>
        </div>
        <div class="verification">
            <img id="codigoQR" class="qr-code" src="" alt="QR Code">
            <p class="verification-text">
                Código de verificación:<br>
                <span id="codigoEmision">[Código]</span>
            </p>
        </div>
    </div>
</body>
</html>`;
