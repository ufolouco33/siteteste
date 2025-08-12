// Utilidades
function brCurrency(value){
  const n = isNaN(value) || value === '' ? 0 : Number(value)
  return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}

function parseBrNumber(str){
  if(typeof str === 'number') return str
  if(!str) return 0
  // aceita 1.234,56 ou 1234.56
  const clean = String(str).replace(/[^0-9,.-]/g,'').replace(/\.(?=.*\.)/g,'').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) ? 0 : n
}

// Conversor de número para extenso (reais)
(function(){
  const unidades = ['','um','dois','três','quatro','cinco','seis','sete','oito','nove']
  const especiais = ['dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove']
  const dezenas = ['','dez','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa']
  const centenas = ['','cem','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos']

  function trioParaExtenso(n){
    n = n % 1000
    if(n === 0) return ''
    let c = Math.floor(n/100), d = Math.floor((n%100)/10), u = n%10
    let partes = []
    if(c){
      if(c === 1 && (d>0 || u>0)) partes.push('cento')
      else partes.push(centenas[c])
    }
    if(d === 1){
      partes.push(especiais[u])
    } else {
      if(d) partes.push(dezenas[d])
      if(u) partes.push(unidades[u])
    }
    return partes.join(' e ')
  }

  function escalaNome(i, valor){
    const nomes = [ ['',''], ['mil','mil'], ['milhão','milhões'], ['bilhão','bilhões'] ]
    if(i === 0) return ''
    const singular = nomes[i][0], plural = nomes[i][1]
    return valor === 1 ? singular : plural
  }

  window.reaisPorExtenso = function(valor){
    valor = Math.round((+valor + Number.EPSILON) * 100) / 100
    const inteiro = Math.floor(valor)
    const centavos = Math.round((valor - inteiro) * 100)
    if(inteiro === 0 && centavos === 0) return 'zero real'

    const grupos = []
    let temp = inteiro, i = 0
    while(temp > 0){
      grupos.push(temp % 1000)
      temp = Math.floor(temp / 1000)
    }

    let partes = []
    for(let j=grupos.length-1;j>=0;j--){
      const n = grupos[j]
      if(n === 0) continue
      const ext = trioParaExtenso(n)
      const nome = escalaNome(j, n)
      partes.push(ext + (nome ? ' ' + nome : ''))
    }

    let texto = partes.join(' e ')
    texto += inteiro === 1 ? ' real' : ' reais'
    if(centavos > 0){
      texto += ' e ' + trioParaExtenso(centavos) + (centavos === 1 ? ' centavo' : ' centavos')
    }
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }
})()

const inputs = {
  empresa: document.getElementById('empresa'),
  pregao: document.getElementById('pregao'),
  uasg: document.getElementById('uasg'),
  cnpj: document.getElementById('cnpj')
}

const itemNumbersContainer = document.getElementById('item-numbers-container')
const itemsContainer = document.getElementById('items-container')
const btnCopy = document.getElementById('copy-document')
const preview = document.getElementById('document-preview')

// Sistema de números de itens dinâmicos
function getItemNumbers(){
  const inputs = itemNumbersContainer.querySelectorAll('.item-number-input')
  return Array.from(inputs).map(inp => parseInt(inp.value) || 0).filter(n => n > 0).sort((a,b) => a-b)
}

function addItemNumberInput(){
  const group = document.createElement('div')
  group.className = 'item-number-group'
  group.innerHTML = `
    <input type="number" class="item-number-input" min="1" max="999" placeholder="Nº do item">
    <button type="button" class="btn-add-item">+</button>
    <button type="button" class="btn-remove-item" style="padding:10px;border-radius:10px;border:1px solid #ff5d5d;background:#2a1616;color:#ff5d5d;cursor:pointer;font-weight:700">×</button>
  `
  itemNumbersContainer.appendChild(group)
  
  // Event listeners para o novo grupo
  const addBtn = group.querySelector('.btn-add-item')
  const removeBtn = group.querySelector('.btn-remove-item')
  const input = group.querySelector('.item-number-input')
  
  addBtn.addEventListener('click', addItemNumberInput)
  removeBtn.addEventListener('click', () => {
    if(itemNumbersContainer.children.length > 1){
      group.remove()
      rebuildItemControls()
    }
  })
  input.addEventListener('input', rebuildItemControls)
  
  // Esconder botão remover se for o único
  updateRemoveButtons()
}

function updateRemoveButtons(){
  const removeButtons = itemNumbersContainer.querySelectorAll('.btn-remove-item')
  removeButtons.forEach(btn => {
    btn.style.display = itemNumbersContainer.children.length > 1 ? 'inline-block' : 'none'
  })
}

function rebuildItemControls(){
  const numbers = getItemNumbers()
  
  // Salvar valores existentes
  const existingData = {}
  const rows = itemsContainer.querySelectorAll('.controls-row')
  rows.forEach((row, idx) => {
    if(idx === 0) return // pular cabeçalho
    const itemNum = row.querySelector('.item-display')?.textContent?.trim()
    if(itemNum){
      existingData[itemNum] = {
        desc: row.children[1]?.querySelector('input')?.value || '',
        qtd: row.children[2]?.querySelector('input')?.value || '',
        vu: row.children[3]?.querySelector('input')?.value || ''
      }
    }
  })
  
  itemsContainer.innerHTML = ''
  
  if(numbers.length === 0) return
  
  // Cabeçalho
  const header = document.createElement('div')
  header.className = 'controls-row'
  header.style.fontWeight = '700'
  header.innerHTML = `
    <div>Item</div>
    <div>Descrição Resumida</div>
    <div>Qtd</div>
    <div>Valor Un.</div>
  `
  itemsContainer.appendChild(header)
  
  // Linhas para cada número de item
  numbers.forEach(num => {
    const itemStr = String(num).padStart(2, '0')
    const saved = existingData[itemStr] || {desc:'', qtd:'', vu:''}
    
    const row = document.createElement('div')
    row.className = 'controls-row'
    row.innerHTML = `
      <div class="item-display">${itemStr}</div>
      <div><input placeholder="Descrição resumida" style="width: 100%; min-width: 300px;" value="${saved.desc}"></div>
      <div><input placeholder="Qtd" type="number" min="0" step="1" value="${saved.qtd}"></div>
      <div><input placeholder="Valor Un." inputmode="decimal" value="${saved.vu}"></div>
    `
    itemsContainer.appendChild(row)
  })
  
  updateRemoveButtons()
  updatePreview()
}

function listaItensTexto(){
  const numbers = getItemNumbers()
  return numbers.map(n => String(n).padStart(2,'0')).join('; ')
}

function coletarLinhasTabela(){
  const rows = itemsContainer.querySelectorAll('.controls-row')
  let totalGeral = 0
  const linhas = []

  rows.forEach((r, idx) => {
    if(idx===0) return // ignora cabeçalho
    const item = r.querySelector('.item-display')?.textContent?.trim() || ''
    const desc = r.children[1].querySelector('input').value
    const uni = 'Unidade'
    const qtd = parseBrNumber(r.children[2].querySelector('input').value)
    const vu = parseBrNumber(r.children[3].querySelector('input').value)
    const vt = qtd * vu
    totalGeral += vt

    linhas.push({item, desc, uni, qtd, vu, vt})
  })

  return {linhas, totalGeral}
}

function renderDocumento(){
  const empresa = inputs.empresa.value || 'EMPRESA'
  const pregao = inputs.pregao.value || '00000/0000'
  const uasg = inputs.uasg.value || '000000 - IFAM'
  const cnpj = inputs.cnpj.value || '00.000.000/0000-00'

  const {linhas, totalGeral} = coletarLinhasTabela()
  const itensTexto = listaItensTexto()

  const html = `
    <div class="document printable">
      <div style="text-align:left;font-weight:800;margin-bottom:8px"><strong>${empresa}</strong></div>
      <div style="text-align:left;margin-bottom:16px"><strong>Assunto:</strong> ADESÃO À ATA DE REGISTRO DE PREÇOS</div>
      <p style="text-align:justify">Senhor Representante,</p>
      <p style="text-align:justify">O Instituto Federal de Educação, Ciência e Tecnologia de Goiás – Câmpus Senado Canedo tem interesse em aderir à Ata de Registro de Preços decorrente do <strong>Pregão SRP ${pregao}</strong> referente à <strong>UASG ${uasg}</strong>, que é o órgão gerenciador deste pregão eletrônico, para aquisição dos <strong>itens ${itensTexto}</strong>, e cujo fornecedor beneficiário é a empresa <strong>${empresa}</strong> – <strong>CNPJ: ${cnpj}</strong>.</p>
      <p style="text-align:justify">Com fulcro no art. 22, § 2º, do Decreto nº 7.892, de 23 de janeiro de 2013, consultamos se a <strong>${empresa}</strong> aceita fornecer o material decorrente da adesão, conforme especificado no quadro abaixo:</p>
      <p><strong>1. IFG SENADOR CANEDO</strong></p>
      <table style="width:100%;border-collapse:collapse;margin-top:10px">
        <tr>
          <td colspan="6" style="border:1px solid #ddd;padding:8px;background:#f3f5f9;font-weight:700;text-align:center">ADESÃO (SEN) Pregão SRP <strong>${pregao}</strong> referente a UASG <strong>${uasg}</strong></td>
        </tr>
        <tr>
          <th style="border:1px solid #ddd;padding:8px;background:#f3f5f9">Item</th>
          <th style="border:1px solid #ddd;padding:8px;background:#f3f5f9">Descrição Resumida</th>
          <th style="border:1px solid #ddd;padding:8px;background:#f3f5f9">Unidade</th>
          <th style="border:1px solid #ddd;padding:8px;background:#f3f5f9">Qtd</th>
          <th style="border:1px solid #ddd;padding:8px;background:#f3f5f9">Valor Un.</th>
          <th style="border:1px solid #ddd;padding:8px;background:#f3f5f9">Valor Total</th>
        </tr>
        ${linhas.map(l => `
        <tr>
          <td style="border:1px solid #ddd;padding:8px">${l.item}</td>
          <td style="border:1px solid #ddd;padding:8px">${l.desc || '-'}</td>
          <td style="border:1px solid #ddd;padding:8px">${l.uni}</td>
          <td style="border:1px solid #ddd;padding:8px">${l.qtd || 0}</td>
          <td style="border:1px solid #ddd;padding:8px">${brCurrency(l.vu)}</td>
          <td style="border:1px solid #ddd;padding:8px">${brCurrency(l.vt)}</td>
        </tr>
        `).join('')}
        <tr>
          <td colspan="5" style="border:1px solid #ddd;padding:8px;font-weight:800;color:#000">Valor total: ${reaisPorExtenso(totalGeral)}</td>
          <td style="border:1px solid #ddd;padding:8px;font-weight:800">${brCurrency(totalGeral)}</td>
        </tr>
      </table>
      <p style="margin-top:16px;text-align:justify">Endereço para entrega ou prestação dos serviços:</p>
      <p style="text-align:justify">IFG – Câmpus Senador Canedo: Rodovia GO-403, Km 07, Quinhão 12-E, CEP 75264-899, Senador Canedo-GO.</p>
      <br>
      <p style="text-align:justify"><strong>Se houver aceitação do fornecimento decorrente de adesão, nas quantidades solicitadas e nos locais indicados, solicitamos que seja informado que o atendimento a esta adesão não prejudicará o compromisso assumido junto ao órgão gerenciador e aos demais participantes do Pregão Eletrônico nº ${pregao}. Solicitamos que nos encaminhem sua resposta através de ofício devidamente assinado pelo representante legal da empresa.</strong></p>
      <br>
      <p style="text-align:justify">Para qualquer necessidade de contato, disponibilizamos o correio eletrônico aquisicoes.senadorcanedo@ifg.edu.br e o telefone (62) 3612-2296.</p>
      <p style="text-align:justify">Na oportunidade, colocamo-nos à disposição para quaisquer esclarecimentos necessários.</p>
      <p style="text-align:justify">Atenciosamente,</p>
      <div style="text-align:center;margin-top:24px;font-size:0.9em">
        <strong>LUIZ EDUARDO BENTO RIBEIRO</strong><br>
        Diretor-Geral SUBSTITUTO do Câmpus Senador Canedo<br>
        PORTARIA Nº 1974 - REITORIA/IFG, DE 09 DE SETEMBRO DE 2024
      </div>
    </div>
  `
  preview.innerHTML = html
}

function updatePreview(){
  renderDocumento()
}

// Função para copiar todo o texto
async function copyDocumentText(){
  const doc = preview.querySelector('.document')
  if(!doc){
    alert('Nenhum documento para copiar!')
    return
  }

  const html = doc.outerHTML
  const textContent = doc.innerText || doc.textContent || ''

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([textContent], { type: 'text/plain' })
      })
      await navigator.clipboard.write([item])
    } else {
      // Fallback com formatação: usar um container escondido contenteditable
      const sandbox = document.createElement('div')
      sandbox.contentEditable = 'true'
      sandbox.style.position = 'fixed'
      sandbox.style.left = '-99999px'
      sandbox.style.top = '0'
      sandbox.innerHTML = html
      document.body.appendChild(sandbox)

      const range = document.createRange()
      range.selectNodeContents(sandbox)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
      const ok = document.execCommand('copy')
      sel.removeAllRanges()
      document.body.removeChild(sandbox)
      if(!ok) throw new Error('execCommand(copy) falhou')
    }

    // Feedback visual
    btnCopy.textContent = 'Copiado!'
    btnCopy.style.background = 'linear-gradient(135deg,#6dd3a0,#4ade80)'
    setTimeout(() => {
      btnCopy.textContent = 'Copiar todo o texto'
      btnCopy.style.background = 'linear-gradient(135deg,#234cff,#6a88ff)'
    }, 2000)
  } catch (err) {
    // Último fallback: texto puro
    try{
      await navigator.clipboard.writeText(textContent)
      btnCopy.textContent = 'Copiado (sem formatação)!'
      setTimeout(() => btnCopy.textContent = 'Copiar todo o texto', 2000)
    }catch(e){
      alert('Erro ao copiar. Tente selecionar e copiar manualmente.')
    }
  }
}

// Eventos
Object.values(inputs).forEach(inp => {
  inp.addEventListener('input', updatePreview)
})

// Eventos para itens
itemsContainer.addEventListener('input', (e) => {
  if(e.target.tagName === 'INPUT'){
    // Tratar vírgulas no valor unitário
    if(e.target.placeholder && e.target.placeholder.includes('Valor Un.')){
      let v = e.target.value.replace(/[^0-9.,-]/g,'')
      const firstComma = v.indexOf(',')
      if(firstComma !== -1){
        v = v.slice(0, firstComma+1) + v.slice(firstComma+1).replace(/[,]/g,'')
      }
      e.target.value = v
    }
    updatePreview()
  }
})

// Formatar valor no blur
itemsContainer.addEventListener('blur', (e) => {
  if(e.target.tagName === 'INPUT' && e.target.placeholder && e.target.placeholder.includes('Valor Un.')){
    const n = parseBrNumber(e.target.value)
    e.target.value = n.toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})
    updatePreview()
  }
}, true)

// Botão copiar
btnCopy.addEventListener('click', copyDocumentText)

// Configuração inicial
document.querySelector('.btn-add-item').addEventListener('click', addItemNumberInput)
document.querySelector('.item-number-input').addEventListener('input', rebuildItemControls)

// Inicializar
rebuildItemControls()
updatePreview()