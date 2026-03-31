import { generateContractPdf } from './server/contractGenerator.ts';
import fs from 'fs';

const fields = {
  tipo_contrato: 'compra_venda',
  nome_vendedor: 'RODRIGO DA SILVA',
  nacionalidade_vendedor: 'brasileiro(a)',
  estado_civil_vendedor: 'solteiro(a)',
  tipo_documento_vendedor: 'RG',
  numero_documento_vendedor: '',
  cpf_cnpj_vendedor: '231.869.868-69',
  endereco_vendedor: 'Rua das Flores, 100 – Brasília, DF',
  nome_comprador: 'KAIO DA SILVA CARVALHO',
  nacionalidade_comprador: 'brasileiro(a)',
  estado_civil_comprador: 'solteiro(a)',
  tipo_documento_comprador: 'RG',
  numero_documento_comprador: '',
  cpf_cnpj_comprador: '987.654.321-00',
  endereco_comprador: 'Av. Central, 200 – Brasília, DF',
  descricao_imovel: 'UM APARTAMENTO sob número cento e vinte e dois (122), localizado no décimo segundo (12°) andar do "Edificio Maison D\'Or", situado na Rua Onze de Junho, número duzentos e oitenta e nove (289), esquina com a Rua Bonifácio José da Rocha e Travessa Maria Ignês Carletti, nesta cidade e comarca, contendo uma área útil privativa de 123,2200m², uma área comum de 88,0031m², totalizando uma área construída de 211,2231m², correspondendo-lhe uma fração ideal de 2,6639% equivalentes a 32,1348m² no terreno e demais coisas de uso comum do condomínio, cabendo-lhe o direito ao uso exclusivo de uma (01) vaga dupla de garagem, situada na garagem coletiva, nos pavimentos subsolos do edifício, a qual é inalienável, indivisível, acessória e indissoluvelmente ligada a unidade autônoma.',
  matricula_imovel: '148.240 – 1º Oficial de Registro de Imóveis, Títulos e Documentos e Civil de Pessoa Jurídica de Jundiaí',
  itens_permanecentes: 'conforme vistoria',
  valor_total: 'R$ 497.000,00',
  modalidade_pagamento: 'À vista',
  valor_vista: 'N/A',
  meio_pagamento: 'À vista',
  prazo_pagamento: 'na assinatura',
  valor_financiamento: 'N/A',
  instituicao_financeira: 'a definir',
  valor_permuta: 'N/A',
  descricao_permuta: 'N/A',
  valor_atribuido_permuta: 'N/A',
  prazo_posse: '30',
  prazo_escritura: '60',
  percentual_comissao: '6%',
  percentual_multa: '10%',
  foro: 'Brasília, Distrito Federal',
  cidade_data: 'Brasília',
  data_contrato: '31 de março de 2026',
  creci_imobiliaria: '28.867 J',
  numero_certidoes: '1',
};

const pdfBuffer = await generateContractPdf(fields);
fs.writeFileSync('/tmp/test_contract_fixed.pdf', pdfBuffer);
console.log('PDF gerado com sucesso:', pdfBuffer.length, 'bytes');
