import { generateContractPdfWithPdfLib } from './server/pdfLibGenerator.ts';
import fs from 'fs';

// HTML de teste com acentuação completa do português
const bodyHtml = `
<h1>CONTRATO PADRÃO DE PROMESSA DE COMPRA E VENDA DE IMÓVEL</h1>
<h2>ADAPTÁVEL AO PAGAMENTO À VISTA, FINANCIAMENTO, PERMUTA OU COMBINADO</h2>

<h2>1. IDENTIFICAÇÃO DAS PARTES</h2>
<p>Pelo presente instrumento particular de PROMESSA DE COMPRA E VENDA DE IMÓVEL, celebram entre si:</p>

<p><strong>VENDEDOR:</strong></p>
<p>DAVID LEANDRO NEPOMUCENO, brasileiro(a), solteiro(a), portador(a) do RG nº 8686-8, inscrito(a) no CPF/CNPJ sob nº 498.743.748-10, residente e domiciliado(a) em ___, doravante denominado(a) <strong>VENDEDOR</strong>.</p>

<p><strong>COMPRADOR(ES):</strong></p>
<p>RODRIGO DA SILVA, brasileiro(a), solteiro(a), portador(a) do RG nº 33056926, inscrito(a) no CPF/CNPJ sob nº 231.869.868-69, residente e domiciliado(a) em ___, doravante denominado(a) <strong>COMPRADOR</strong>.</p>

<p><strong>INTERMEDIADORA (SE APLICÁVEL):</strong></p>
<p>Marcello &amp; Oliveira Imóveis, inscrita no CNPJ sob nº 12.345.678/0001-99, CRECI nº 28.867 J, com endereço comercial em CRECI 28.867 J – Brasília, DF, doravante denominada <strong>INTERMEDIADORA</strong>.</p>

<h2>2. OBJETO DO CONTRATO</h2>
<p>O presente contrato tem por objeto a promessa de compra e venda do imóvel de propriedade do VENDEDOR ao(s) COMPRADOR(ES), podendo envolver pagamento à vista, financiamento imobiliário, sendo o imóvel ou combinação dessas modalidades, conforme definido neste instrumento.</p>

<h2>3. DESCRIÇÃO DO IMÓVEL E ITENS QUE O INTEGRAM</h2>
<p><strong>Descrição do Imóvel:</strong></p>
<p>UM LOTE DE TERRENO sob número quinze (15) da Quadra "R" do loteamento denominado "Santa Giovana", situado nesta cidade e comarca, com a área de 201,80 metros quadrados, que assim se descreve: mede 10,09 metros em reta de frente para a Rua 17; 20,00 metros do lado direito de quem da rua olha o imóvel, confrontando com o Sistema de Lazer "03" Chácaras de Recreio Santa Camila; 20,00 metros do lado esquerdo de quem da rua olha o imóvel, confrontando com o lote 14; 10,09 metros nos fundos confrontando com o lote 16. Posteriormente, foi CONSTRUÍDO um prédio residencial com 231,37 metros quadrados de área total edificada, sendo 147,28 metros quadrados de residência no pavimento térreo e 84,09 metros quadrados de residência no pavimento superior, situado na Rua Francisco Cândido da Silva, número cento e trinta e um (131).</p>

<h2>4. VALOR TOTAL E MODALIDADE DE PAGAMENTO</h2>
<p>O valor total ajustado para a presente transação é de <strong>R$ 1.000.000</strong>, a ser pago conforme a modalidade abaixo indicada:</p>
<p>Modalidade de pagamento: À vista</p>

<h2>5. PAGAMENTO À VISTA (SE APLICÁVEL)</h2>
<p>Esta cláusula somente produzirá efeitos quando a modalidade de pagamento for <strong>à vista</strong> ou <strong>combinada</strong>.</p>
<p>O pagamento à vista será realizado no valor de N/A, por meio de À vista, até na assinatura.</p>

<h2>6. PAGAMENTO POR FINANCIAMENTO IMOBILIÁRIO (SE APLICÁVEL)</h2>
<p>Esta cláusula somente produzirá efeitos quando a modalidade for <strong>financiamento</strong> ou <strong>combinada</strong>.</p>
<p>Parte do valor será financiado no valor de N/A, junto à instituição financeira a definir.</p>
<p>Parágrafo único: A liberação do crédito está condicionada à aprovação, avaliação do imóvel e registro da escritura. A reprovação por motivo alheio às partes implicará rescisão sem multa.</p>

<h2>7. CLÁUSULAS GERAIS</h2>
<p>Parágrafo Primeiro: O imóvel é transmitido em caráter <strong>ad corpus</strong>, como coisa certa e discriminada, sendo aceito pelo(s) COMPRADOR(ES) no estado em que se encontra, ressalvadas as disposições expressas neste contrato.</p>
<p>Parágrafo Segundo: Permanecerão no imóvel, fazendo parte integrante e indissociável da presente transação, os seguintes bens, móveis, equipamentos e/ou benfeitorias: conforme vistoria.</p>
<p>Parágrafo Terceiro: Os itens acima descritos não poderão ser retirados, substituídos ou removidos pelo VENDEDOR antes da imissão na posse, salvo autorização expressa e escrita do(s) COMPRADOR(ES).</p>
`;

console.log('Gerando PDF com fonte Roboto (UTF-8)...');
const start = Date.now();

try {
  const buffer = await generateContractPdfWithPdfLib(bodyHtml);
  const elapsed = Date.now() - start;
  
  fs.writeFileSync('/home/ubuntu/test-roboto-output.pdf', buffer);
  console.log(`✅ PDF gerado em ${elapsed}ms — ${buffer.length} bytes`);
  console.log('Arquivo: /home/ubuntu/test-roboto-output.pdf');
} catch (e) {
  console.error('❌ Erro:', e.message);
  console.error(e.stack);
}
