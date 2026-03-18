import { generateContractPdf } from './server/contractGenerator';
import { writeFileSync } from 'fs';

async function main() {
  const fields = {
    nome_vendedor: 'PETERSON ALVES DE OLIVEIRA',
    cpf_cnpj_vendedor: '123.456.789-00',
    numero_documento_vendedor: '6847344F',
    endereco_vendedor: 'Rua das Acácias, 450, Apto 302, Goiânia/GO',
    nome_comprador: 'RODRIGO DA SILVA',
    cpf_cnpj_comprador: '231.869.868-69',
    numero_documento_comprador: '33056926',
    endereco_comprador: 'Rua das Palmeiras, 340, Goiânia/GO',
    descricao_imovel: 'Apartamento residencial com 3 dormitórios (1 suíte), sala de estar e jantar, cozinha planejada, área de serviço, 2 banheiros sociais e 1 vaga de garagem coberta.',
    matricula_imovel: '45.678',
    cartorio_registro_imoveis: '2º Cartório de Registro de Imóveis de Goiânia',
    itens_que_permanecerao_no_imovel: 'Armários embutidos, ar-condicionado split',
    valor_total_contrato: 'R$ 485.000,00',
    modalidade_pagamento: 'À vista',
    valor_pagamento_avista: 'R$ 485.000,00',
    forma_pagamento_avista: 'Transferência bancária (TED/PIX)',
    data_pagamento_avista: '25/03/2026',
    cidade_assinatura: 'Goiânia, GO',
    data_assinatura: '18/03/2026',
  };
  console.log('Generating contract PDF...');
  const buf = await generateContractPdf(fields);
  const outPath = `/tmp/fresh_${Date.now()}.pdf`;
  writeFileSync(outPath, buf);
  console.log(`Done! ${buf.length} bytes → ${outPath}`);
}

main().catch(console.error);
