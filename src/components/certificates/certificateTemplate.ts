
export const getCertificateTemplate = () => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificado Profesional</title>
    <style>
        @page {
            size: landscape;
            margin: 0;
        }
        body {
            width: 29.7cm;
            height: 21cm;
            margin: 0;
            padding: 0;
            font-family: 'Times New Roman', serif;
            background: #fff;
            -webkit-print-color-adjust: exact;
            position: relative;
        }
        .certificate-container {
            width: 100%;
            height: 100%;
            padding: 2cm;
            box-sizing: border-box;
            background: linear-gradient(to bottom right, rgba(255,255,255,0.95), rgba(245,245,245,0.95));
            position: relative;
            border: 20px double #2c3e50;
        }
        .header {
            text-align: center;
            margin-bottom: 2cm;
        }
        .logo {
            max-width: 180px;
            margin-bottom: 1cm;
        }
        .title {
            font-size: 54px;
            color: #2c3e50;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 6px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .content {
            text-align: center;
            margin: 0 auto;
            max-width: 80%;
        }
        .intro-text {
            font-size: 26px;
            color: #34495e;
            margin: 15px 0;
            font-style: italic;
        }
        .name {
            font-size: 42px;
            color: #2c3e50;
            margin: 30px 0;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-family: 'Times New Roman', serif;
        }
        .course-name {
            font-size: 32px;
            margin: 30px 0;
            color: #34495e;
            font-weight: bold;
        }
        .description {
            font-size: 22px;
            color: #34495e;
            margin: 40px auto;
            line-height: 1.6;
            max-width: 80%;
        }
        .signatures {
            display: flex;
            justify-content: space-around;
            margin: 2cm 0;
            padding: 0 2cm;
        }
        .signature {
            text-align: center;
            width: 300px;
        }
        .signature-img {
            width: 220px;
            height: 90px;
            margin-bottom: 10px;
            object-fit: contain;
        }
        .signature-line {
            width: 100%;
            border-top: 2px solid #2c3e50;
            margin: 10px 0;
        }
        .signature-name {
            font-size: 20px;
            margin: 5px 0;
            font-weight: bold;
            color: #2c3e50;
        }
        .signature-title {
            font-size: 18px;
            color: #7f8c8d;
            font-style: italic;
        }
        .footer {
            text-align: center;
            position: absolute;
            bottom: 2cm;
            width: 100%;
            left: 0;
        }
        .footer p {
            font-size: 20px;
            color: #34495e;
            margin: 0;
        }
        .verification {
            position: absolute;
            bottom: 1.5cm;
            right: 2cm;
            text-align: right;
        }
        .qr-code {
            width: 100px;
            height: 100px;
            margin-bottom: 5px;
        }
        .verification-text {
            font-size: 14px;
            color: #7f8c8d;
        }
        .border-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 2px solid #2c3e50;
            margin: 10px;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="border-pattern"></div>
        <div class="header">
            <img id="logoEmpresa" class="logo" src="" alt="Logo">
            <h1 class="title">Certificado Profesional</h1>
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
