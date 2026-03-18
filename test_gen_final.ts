import { generateContractPdf } from './server/contractGenerator';
import { writeFileSync } from 'fs';

const fields = {
  nome_vendedor: 'PETERSON ALVES DE OLIVEIRA',
  cpf_cnpj_vendedor: '123.456.789-00',
  numero_documento_vendedor: '6847344F',
  endereco_vendedor: 'Rua das Acácias, 450, Apto 302, Goiânia/GO',

  nome_comprador: 'RODRIGO DA SILVA',
  cpf_cnpj_comprador: '231.869.868-69',
  numero_documento_comprador: '33056926',
  endereco_comprador: 'Rua das Palmeiras, 340, Goiânia/GO',

  descricao_imovel: 'Apartamento residencial com 3 dormitórios (1 suíte), sala de estar e jantar, cozinha planejada, área de serviço, 2 banheiros sociais e 1 vaga de garagem coberta. Imóvel em ótimo estado de conservação, com acabamento de alto padrão, situado na Rua das Acácias, 450, Apto 302 Bloco B, Jardim Europa, Goiânia, GO, 74255-080.',
  matricula_imovel: '45.678',
  cartorio_registro_imoveis: '2º Cartório de Registro de Imóveis de Goiânia',
  itens_que_permanecerao_no_imovel: 'Armários embutidos dos dormitórios, armários da cozinha planejada, ar-condicionado split, churrasqueira',

  valor_total_contrato: 'R$ 485.000,00',
  modalidade_pagamento: 'À vista',
  valor_pagamento_avista: 'R$ 485.000,00',
  forma_pagamento_avista: 'Transferência bancária (TED/PIX)',
  data_pagamento_avista: '25/03/2026',

  cidade_assinatura: 'Goiânia, GO',
  data_assinatura: '18/03/2026',
};

console.log('Generating contract PDF with puppeteer...');
const buf = await generateContractPdf(fields);
writeFileSync('/tmp/test_gen_v2.pdf', buf);
console.log(`Done! ${buf.length} bytes → /tmp/test_gen_v2.pdf`);
