document.getElementById('generate-pdfs').addEventListener('click', () => {
    const fileInput = document.getElementById('file-input').files[0];

    if (fileInput) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const headers = rows[0];
            const workers = rows.slice(1);

            workers.forEach((worker) => {
                const workerData = headers.reduce((acc, header, index) => {
                    acc[header] = worker[index];
                    return acc;
                }, {});
                generarBoleta(workerData);
            });
        };
        reader.readAsArrayBuffer(fileInput);
    } else {
        alert('Por favor, sube un archivo Excel primero.');
    }
});

function formatearMonto(monto) {
    if (!monto || monto === 'No aplica') return 'No aplica';
    return 'C'+ Number(monto).toLocaleString('es-CR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function generarBoleta(trabajador) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Utilizar la fuente Helvetica
    doc.setFont("Helvetica");

    const fechaActual = new Date();
    const opciones = { year: 'numeric', month: 'long' };
    const fechaFormateada = fechaActual.toLocaleDateString('es-ES', opciones).toUpperCase();

    const imgUrl = 'logo.jpg';

    // Cargar la imagen y generar el PDF
    const image = new Image();
    image.src = imgUrl;
    image.onload = () => {
        doc.addImage(image, 'JPEG', 10, 10, 30, 30);
        agregarContenidoPDF(doc, trabajador, fechaFormateada);
    };
}

function agregarContenidoPDF(doc, trabajador, fechaFormateada) {
    doc.setFontSize(20);
    doc.text('Boleta de Pago', 110, 20, null, null, 'center');
    doc.setFontSize(12);
    doc.text(fechaFormateada, 110, 30, null, null, 'center');

    const headers = [
        ['Nombre:', trabajador['Nombres y Apellidos'] || 'No aplica'],
        ['Días trabajados:', `${trabajador['Días Trabaj'] || 'No aplica'}`],
        ['Cargo:', `${trabajador['Cargo'] || 'No aplica'}`],
        ['Salario por día:', formatearMonto(trabajador['Salario por día'])],
        ['Años de servicio:', `${trabajador['Antigüedad'] || 'No aplica'}`],
        ['Lecciones:', `${trabajador['Lecciones'] || 'No aplica'}`]
    ];

    const data = [
        ['Salario Bruto:', formatearMonto(trabajador['Salario Bruto']), '', 'Recargo tutora :', formatearMonto(trabajador['RECARGO'])],
        ['Incapacidad:', `${trabajador['Motivo'] || 'No aplica'}`],
        ['Ausencias:', `${trabajador['REBAJO'] || 'No aplica'}`],
        ['Salario Devengado:', formatearMonto(trabajador['Salario Bruto']), '', '', ''],
        ['CCSS:', formatearMonto(trabajador['CCSS']), '', 'Magisterio:', formatearMonto(trabajador['Magisterio Póliza :'])],
        ['Junta de Pensiones:', formatearMonto(trabajador['Junta de Pensiones:']), '', 'Adelantos/Otros:', formatearMonto(trabajador['SOCIALES'])],
        ['Rebajos:', `${trabajador['Motivo'] || 'No aplica'}`, '', 'Licencias:', 'No aplica'],
        ['Actividades sociales:', 'No aplica', `${trabajador['Lecciones'] || 'No aplica'}`, '', ''],
        ['Total de Deducciones:', formatearMonto(trabajador['SOCIALES']), '', '', ''],
        ['Devoluciones:', '', 'No aplica', '', ''],
        ['Salario Neto:', formatearMonto(trabajador['SALARIO NETO2']), '', '', '']
    ];

    const filteredData = data.filter(row => row.some(cell => cell !== '' && cell !== '0' && cell !== '-' && cell !== 'No aplica'));

    doc.autoTable({
        head: headers,
        body: filteredData,
        startY: 50,
        theme: 'grid',
        styles: {
            fontSize: 12,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1
        },
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
        },
        bodyStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0]
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 50 },
            2: { cellWidth: 40 },
            3: { cellWidth: 40 },
            4: { cellWidth: 50 }
        },
        margin: { left: 65, right: 65 }, // Margen lateral para centrar la tabla
  
    });

    doc.save(`boleta_${trabajador['Nombres y Apellidos'] || 'trabajador'}.pdf`);
}
