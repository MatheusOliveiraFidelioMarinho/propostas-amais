/*
 * Cadastro das propostas do portal.
 *
 * Cada proposta aponta para uma pasta em propostas/ e para a página que abre
 * nela. Propostas que compartilham o mesmo modelo (ex.: Binatural GO e BA)
 * usam a mesma pasta e mudam só os dados salvos pelo painel.
 *
 * `modelo` define os campos editáveis no /admin. Sem modelo, a proposta é só
 * hospedada e compartilhável, sem campos.
 */

const CLUSTER = {
  campos: [
    { secao: 'Identificação', id: 'local', rotulo: 'Unidade (como aparece nos slides)', padrao: '' },
    { secao: 'Identificação', id: 'tag', rotulo: 'Texto da capa, abaixo do logo', padrao: '' },
    { secao: 'Identificação', id: 'contato', rotulo: 'A/C (contato do cliente)', padrao: 'Sr. David' },
    { secao: 'Identificação', id: 'data', rotulo: 'Data da capa', padrao: 'Setembro de 2026' },
    { secao: 'Identificação', id: 'cidade_data', rotulo: 'Local e data da assinatura', padrao: 'Brasília, 30 de setembro de 2026' },
    { secao: 'Identificação', id: 'validade', rotulo: 'Validade da proposta', padrao: '30 dias' },
    { secao: 'Comercial', id: 'pagamento', rotulo: 'Condições de pagamento (em branco não aparece)', padrao: '' },
    { secao: 'Comercial', id: 'margem_padrao', rotulo: 'Margem padrão (%) para itens sem margem própria', tipo: 'numero', padrao: '' },
    { secao: 'Comercial', id: 'exibir_precos', rotulo: 'Mostrar o valor de cada item nas tabelas', tipo: 'booleano', padrao: false },
    { secao: 'Comercial', id: 'exibir_investimento', rotulo: 'Mostrar o slide de investimento ao cliente (só aparece com todos os itens com preço)', tipo: 'booleano', padrao: true },
  ],
  listas: {
    materiais: [
      { id: 'servidor', grupo: 'Processamento', qtd: 2, item: 'Servidor Dell PowerEdge R360',
        spec: 'Rack 1U · Xeon 6 6369P · 64 GB DDR5 · 2 TB SATA · fonte redundante 600 W · iDRAC9 · trilhos · Windows Server 2025 Std',
        custo: 62682, ref: 'Configuração Dell pe_r360_18250' },
      { id: 'qnap', grupo: 'Armazenamento', qtd: 1, item: 'Storage QNAP TS-435XeU-4G',
        spec: 'Rack 1U · 4 baias · 4 GB DDR4 · 2 × 10 GbE SFP+ · 2 × 2.5 GbE · 2 slots M.2 NVMe',
        custo: 7156.25, ref: 'KaBuM 531217' },
      { id: 'hd', grupo: 'Armazenamento', qtd: 4, item: 'HD Seagate IronWolf 8 TB',
        spec: 'NAS · 7200 RPM · 256 MB cache · SATA III (ST8000VN004)',
        custo: 3302.84, ref: 'KaBuM 1061059 (PIX)' },
      { id: 'ssd', grupo: 'Armazenamento', qtd: 2, item: 'SSD NVMe M.2 2 TB',
        spec: 'Formato 2280 · camada de desempenho em RAID 1',
        custo: 2499.99, ref: 'KaBuM 542144 (base de valor)' },
      { id: 'switch', grupo: 'Rede', qtd: 1, item: 'Switch UniFi Pro XG 24',
        spec: 'USW-Pro-XG-24 · camada 3 · 16 × 10 GbE · 8 × 2.5 GbE · 2 × SFP28',
        custo: 10465, ref: 'Loja UI, com impostos' },
      { id: 'rack', grupo: 'Infraestrutura', qtd: 1, item: 'Rack fechado 19" tipo servidor',
        spec: 'Ref. Triunfo Server · profundidade 1000 mm · portas perfuradas com chave · laterais removíveis',
        ref: 'Cotar na Krista ou Horus' },
      { id: 'diversos', grupo: 'Infraestrutura', qtd: 1, item: 'Materiais diversos',
        spec: 'Cabos de rede, patch cords, módulos e cabos SFP, organizadores e acessórios de fixação' },
    ],
    servicos: [
      { id: 'levantamento', qtd: 1, item: 'Levantamento e projeto executivo',
        spec: 'Inventário dos sistemas, volumes de dados, janelas de manutenção e validação do projeto' },
      { id: 'montagem', qtd: 1, item: 'Montagem física e cabeamento',
        spec: 'Instalação do rack, servidores, storage e switch, com cabeamento identificado e organizado' },
      { id: 'storage', qtd: 1, item: 'Configuração do storage',
        spec: 'RAID 1 NVMe e RAID 10 HDD, volumes iSCSI e NFS e serviço QDevice' },
      { id: 'rede', qtd: 1, item: 'Configuração da rede',
        spec: 'VLANs de gerência, cluster, storage, migração e produção, jumbo frames e regras de acesso' },
      { id: 'cluster', qtd: 1, item: 'Implantação do cluster Proxmox VE',
        spec: 'Instalação dos nós, criação do cluster, quorum, storages compartilhados e grupos de HA' },
      { id: 'migracao', qtd: 1, item: 'Migração dos servidores atuais',
        spec: 'Conversão dos servidores em máquinas virtuais fora do expediente e validação com os usuários' },
      { id: 'backup', qtd: 1, item: 'Backup e testes de falha',
        spec: 'Rotina de backup com retenção e testes simulados de falha de nó, disco e link' },
      { id: 'entrega', qtd: 1, item: 'Documentação, treinamento e suporte',
        spec: 'Documentação da solução, treinamento da equipe e suporte presencial e remoto por 90 dias' },
    ],
  },
};

// Rede óptica GPON: mesmos campos do cluster, listas próprias.
const GPON = {
  campos: CLUSTER.campos,
  listas: {
    materiais: [
      { id: 'olt', grupo: 'Equipamentos ativos', qtd: 1, item: 'OLT Intelbras 8820i',
        spec: '8 portas GPON · 2 uplinks 10G SFP+ · 2 fontes AC redundantes' },
      { id: 'sfp-gpon', grupo: 'Equipamentos ativos', qtd: 7, item: 'Módulo GPON SFP classe C+',
        spec: '6 portas PON em uso e 1 módulo reserva', ref: 'Confirmar se acompanham a OLT' },
      { id: 'aggregation', grupo: 'Equipamentos ativos', qtd: 1, item: 'Switch Ubiquiti USW-Pro-Aggregation',
        spec: '28 × SFP+ 10G · 4 × SFP28 25G · camada 3' },
      { id: 'dac', grupo: 'Equipamentos ativos', qtd: 2, item: 'Cabo DAC SFP+ 10G de 1 m',
        spec: 'Ligação OLT e Switch Aggregation, em LACP' },
      { id: 'bidi', grupo: 'Equipamentos ativos', qtd: 5, item: 'Par de módulos SFP+ BiDi 10G monomodo',
        spec: 'WDM em 1 fibra · 10 km · 4 uplinks e 1 par reserva' },
      { id: 'ont', grupo: 'Equipamentos ativos', qtd: 17, item: 'ONT GPON modo bridge',
        spec: '1 porta Gigabit · conector SC/APC', ref: 'Modelo a definir' },
      { id: 'splitter', grupo: 'Rede óptica passiva', qtd: 6, item: 'Splitter óptico PLC 1x2 SC/APC',
        spec: 'Primeiro nível, instalado no rack do CPD' },
      { id: 'xftta', grupo: 'Rede óptica passiva', qtd: 11, item: 'Caixa XFTTA 2008 Intelbras',
        spec: 'Com splitter 1x8 e 8 saídas SC/APC' },
      { id: 'dio-cpd', grupo: 'Rede óptica passiva', qtd: 1, item: 'DIO 48FO para rack',
        spec: 'CPD · adaptadores SC/APC · 28 posições equipadas' },
      { id: 'dio', grupo: 'Rede óptica passiva', qtd: 7, item: 'DIO 12FO',
        spec: '4 posições SC/APC equipadas, expansível a 12' },
      { id: 'pigtail', grupo: 'Rede óptica passiva', qtd: 56, item: 'Pigtail SC/APC monomodo',
        spec: '28 no DIO CPD e 28 nos DIOs remotos' },
      { id: 'cordoes', grupo: 'Rede óptica passiva', qtd: 25, item: 'Cordões ópticos simplex',
        spec: '6 SC/UPC–SC/APC · 11 SC/APC–SC/APC · 8 SC/APC–LC/UPC' },
      { id: 'cabo12', grupo: 'Cabos', qtd: 7, item: 'Lance de cabo óptico monomodo 12FO',
        spec: 'Backbone entre os DIOs · metragem conforme levantamento', ref: 'Metragem a levantar em campo' },
      { id: 'cabo-xftta', grupo: 'Cabos', qtd: 11, item: 'Lance de cabo óptico DIO até caixa XFTTA',
        spec: 'Alimentação das caixas · metragem conforme levantamento', ref: 'Metragem a levantar em campo' },
      { id: 'drop', grupo: 'Cabos', qtd: 17, item: 'Cabo drop óptico 1FO SC/APC',
        spec: 'Da caixa XFTTA até a ONT de cada ponto', ref: 'Metragem a levantar em campo' },
      { id: 'diversos', grupo: 'Cabos', qtd: 1, item: 'Materiais diversos',
        spec: 'Patch cords Cat6, etiquetas, organizadores e acessórios de fixação' },
    ],
    servicos: [
      { id: 'levantamento', qtd: 1, item: 'Levantamento e projeto executivo',
        spec: 'Rotas, metragens, pontos de fixação e validação do projeto em campo' },
      { id: 'cabos', qtd: 1, item: 'Lançamento dos cabos ópticos',
        spec: '7 lances de 12FO entre os DIOs e os cabos de alimentação das caixas' },
      { id: 'fusoes', qtd: 1, item: 'Montagem dos DIOs e fusões',
        spec: '8 DIOs, 4 fibras em SC/APC por DIO remoto e fusões de passagem' },
      { id: 'caixas', qtd: 1, item: 'Instalação das caixas XFTTA e drops',
        spec: '11 caixas com splitter 1x8 e drops até as 17 ONTs' },
      { id: 'cpd', qtd: 1, item: 'Montagem do rack do CPD',
        spec: 'OLT, Switch Aggregation, splitters 1x2 e cordões identificados' },
      { id: 'config', qtd: 1, item: 'Configuração da rede',
        spec: 'OLT, ONTs, VLANs, LACP nos uplinks de 10G e proteção contra laço' },
      { id: 'testes', qtd: 1, item: 'Certificação e testes',
        spec: 'OTDR nas fibras, potência óptica em todos os pontos e testes de falha' },
      { id: 'entrega', qtd: 1, item: 'Documentação, treinamento e suporte',
        spec: 'As-built, treinamento da equipe e suporte presencial e remoto por 90 dias' },
    ],
  },
};

export const PROPOSTAS = [
  {
    slug: 'binatural-cluster-go',
    cliente: 'Binatural',
    titulo: 'Cluster Proxmox VE · apresentação e proposta',
    unidade: 'Formosa, GO',
    pasta: 'binatural-cluster',
    pagina: 'proposta.html',
    modelo: CLUSTER,
    padroes: { local: 'Formosa, GO', tag: 'Formosa · Goiás' },
  },
  {
    slug: 'binatural-cluster-ba',
    cliente: 'Binatural',
    titulo: 'Cluster Proxmox VE · apresentação e proposta',
    unidade: 'Bahia',
    pasta: 'binatural-cluster',
    pagina: 'proposta.html',
    modelo: CLUSTER,
    padroes: { local: 'Bahia', tag: 'Filial · Bahia' },
  },
  {
    slug: 'binatural-gpon-go',
    cliente: 'Binatural',
    titulo: 'Rede óptica GPON · projeto e proposta',
    unidade: 'Formosa, GO',
    pasta: 'binatural-gpon',
    pagina: 'proposta.html',
    modelo: GPON,
    padroes: { local: 'Formosa, GO', tag: 'Formosa · Goiás', data: 'Outubro de 2026', cidade_data: 'Brasília, 8 de outubro de 2026' },
  },
  {
    slug: 'binatural-gpon-go-projeto',
    cliente: 'Binatural',
    titulo: 'Rede óptica GPON · projeto técnico',
    unidade: 'Formosa, GO',
    pasta: 'binatural-gpon',
    pagina: 'projeto.html',
  },
  {
    slug: 'cftv-termico-samambaia',
    cliente: 'UFV Samambaia',
    titulo: 'CFTV térmico de perímetro',
    unidade: 'UFV Samambaia',
    pasta: 'cftv-termico-samambaia',
    pagina: 'index.html',
  },
];

export const STATUS = ['Rascunho', 'Em cotação', 'Enviada', 'Aprovada', 'Recusada'];

export function proposta(slug) {
  return PROPOSTAS.find((p) => p.slug === slug) || null;
}
