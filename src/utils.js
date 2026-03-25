export function fileToBase64(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader()
    reader.onload = function() { resolve(reader.result.split(',')[1]) }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function extractPdfText(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader()
    reader.onload = async function(e) {
      try {
        const typedArray = new Uint8Array(e.target.result)

        // Carrega PDF.js do CDN
        if (!window.pdfjsLib) {
          await new Promise(function(res, rej) {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
            script.onload = res
            script.onerror = rej
            document.head.appendChild(script)
          })
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        }

        const pdf = await window.pdfjsLib.getDocument({ data: typedArray }).promise
        let fullText = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          const pageText = content.items.map(function(item) { return item.str }).join(' ')
          fullText += 'Página ' + i + ':\n' + pageText + '\n\n'
        }
        resolve(fullText || 'Não foi possível extrair texto deste PDF.')
      } catch (err) {
        resolve('Erro ao ler PDF: ' + err.message)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
