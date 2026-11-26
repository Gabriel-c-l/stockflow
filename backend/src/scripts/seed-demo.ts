import "dotenv/config";
import { prisma } from "../config/database";

const SEED_TAG = "[STOCKFLOW-DEMO-SEED-V1]";

const categories = [
  { name: "Periféricos", description: "Teclados, mouses e acessórios de informática." },
  { name: "Monitores", description: "Monitores e telas para estações de trabalho." },
  { name: "Armazenamento", description: "SSDs, HDs e dispositivos de armazenamento." },
  { name: "Componentes", description: "Memórias, fontes e componentes de computadores." },
  { name: "Cabos e Conectividade", description: "Cabos, adaptadores e equipamentos de rede." },
];

const suppliers = [
  { name: "TecnoDistribuidora Sul Ltda.", email: "contato@tecnodistribuidora.example", phone: "48999991001", address: "Rua das Indústrias, 120, Florianópolis - SC", notes: "Distribuidora fictícia de periféricos." },
  { name: "ConectaTI Atacado", email: "vendas@conectati.example", phone: "48999991002", address: "Av. Central, 450, São José - SC", notes: "Fornecedor fictício de conectividade." },
  { name: "Sul Componentes", email: "comercial@sulcomponentes.example", phone: "48999991003", address: "Rua do Comércio, 88, Palhoça - SC", notes: "Fornecedor fictício de componentes." },
  { name: "Mundo dos Monitores", email: "pedidos@mundodosmonitores.example", phone: "48999991004", address: "Av. Industrial, 900, Curitiba - PR", notes: "Fornecedor fictício de monitores." },
  { name: "Armazém Digital", email: "estoque@armazemdigital.example", phone: "48999991005", address: "Rua Paraná, 310, Joinville - SC", notes: "Fornecedor fictício de armazenamento." },
  { name: "NorteSul Informática", email: "atendimento@nortesulinfo.example", phone: "48999991006", address: "Rua XV de Novembro, 75, Blumenau - SC", notes: "Fornecedor fictício de informática geral." },
  { name: "Byte a Byte Distribuição", email: "vendas@byteabyte.example", phone: "48999991007", address: "Av. Brasil, 1600, Itajaí - SC", notes: "Fornecedor fictício de acessórios." },
  { name: "Prime Hardware", email: "comercial@primehardware.example", phone: "48999991008", address: "Rua da Tecnologia, 42, Porto Alegre - RS", notes: "Fornecedor fictício de hardware." },
];

const products = [
  ["PER-001", "Teclado USB Logitech K120", "Teclado ABNT2 com conexão USB.", "Periféricos", 79.90, 18, 5, "UN", "A-01"],
  ["PER-002", "Mouse Logitech M90", "Mouse óptico USB para uso diário.", "Periféricos", 39.90, 32, 8, "UN", "A-02"],
  ["PER-003", "Teclado sem fio Logitech K230", "Teclado compacto sem fio.", "Periféricos", 139.90, 7, 5, "UN", "A-03"],
  ["PER-004", "Mouse sem fio Logitech M170", "Mouse sem fio com receptor USB.", "Periféricos", 89.90, 0, 4, "UN", "A-04"],
  ["PER-005", "Headset USB H390", "Headset com microfone e conexão USB.", "Periféricos", 249.90, 11, 3, "UN", "A-05"],
  ["MON-001", "Monitor LG 24 polegadas Full HD", "Monitor IPS Full HD para escritório.", "Monitores", 749.90, 9, 3, "UN", "B-01"],
  ["MON-002", "Monitor Samsung 22 polegadas", "Monitor LED Full HD.", "Monitores", 629.90, 4, 3, "UN", "B-02"],
  ["MON-003", "Monitor Dell 27 polegadas QHD", "Monitor QHD para produtividade.", "Monitores", 1699.90, 2, 2, "UN", "B-03"],
  ["MON-004", "Suporte articulado para monitor", "Suporte de mesa com ajuste articulado.", "Monitores", 189.90, 14, 4, "UN", "B-04"],
  ["ARM-001", "SSD Kingston 480 GB", "SSD SATA para computadores e notebooks.", "Armazenamento", 289.90, 16, 5, "UN", "C-01"],
  ["ARM-002", "SSD NVMe Kingston 1 TB", "SSD NVMe M.2 de 1 TB.", "Armazenamento", 499.90, 6, 3, "UN", "C-02"],
  ["ARM-003", "HD externo Seagate 2 TB", "Disco externo USB de 2 TB.", "Armazenamento", 529.90, 3, 3, "UN", "C-03"],
  ["ARM-004", "Pen drive Kingston 64 GB", "Unidade flash USB de 64 GB.", "Armazenamento", 39.90, 28, 10, "UN", "C-04"],
  ["ARM-005", "Cartão microSD 128 GB", "Cartão microSD com adaptador.", "Armazenamento", 69.90, 1, 5, "UN", "C-05"],
  ["COM-001", "Memória Kingston DDR4 8 GB", "Módulo de memória DDR4 8 GB.", "Componentes", 159.90, 12, 4, "UN", "D-01"],
  ["COM-002", "Memória Kingston DDR4 16 GB", "Módulo de memória DDR4 16 GB.", "Componentes", 269.90, 8, 4, "UN", "D-02"],
  ["COM-003", "Fonte ATX 500 W", "Fonte de alimentação para desktop.", "Componentes", 249.90, 5, 2, "UN", "D-03"],
  ["COM-004", "Placa-mãe Micro ATX", "Placa-mãe para processadores compatíveis.", "Componentes", 589.90, 2, 2, "UN", "D-04"],
  ["COM-005", "Cooler para processador", "Cooler a ar para gabinete desktop.", "Componentes", 99.90, 0, 3, "UN", "D-05"],
  ["COM-006", "Gabinete Micro ATX", "Gabinete compacto para desktop.", "Componentes", 229.90, 6, 2, "UN", "D-06"],
  ["CAB-001", "Cabo HDMI 2 metros", "Cabo HDMI de alta velocidade.", "Cabos e Conectividade", 29.90, 35, 10, "UN", "E-01"],
  ["CAB-002", "Cabo de rede CAT6 5 metros", "Cabo de rede CAT6 com conectores.", "Cabos e Conectividade", 34.90, 19, 6, "UN", "E-02"],
  ["CAB-003", "Adaptador USB-C para HDMI", "Adaptador de vídeo USB-C para HDMI.", "Cabos e Conectividade", 89.90, 7, 3, "UN", "E-03"],
  ["CAB-004", "Hub USB 4 portas", "Hub USB para expansão de portas.", "Cabos e Conectividade", 69.90, 13, 5, "UN", "E-04"],
  ["CAB-005", "Switch de rede 8 portas", "Switch Ethernet não gerenciável.", "Cabos e Conectividade", 159.90, 4, 2, "UN", "E-05"],
  ["CAB-006", "Roteador Wi-Fi dual band", "Roteador sem fio dual band.", "Cabos e Conectividade", 289.90, 3, 2, "UN", "E-06"],
  ["PER-006", "Webcam Full HD", "Webcam USB Full HD para reuniões.", "Periféricos", 179.90, 10, 3, "UN", "A-06"],
  ["PER-007", "Mousepad ergonômico", "Mousepad com apoio para punho.", "Periféricos", 49.90, 22, 8, "UN", "A-07"],
  ["COM-007", "Pasta térmica 4 g", "Pasta térmica para manutenção.", "Componentes", 24.90, 17, 6, "UN", "D-07"],
  ["CAB-007", "Filtro de linha 5 tomadas", "Filtro de linha com proteção básica.", "Cabos e Conectividade", 59.90, 0, 4, "UN", "E-07"],
] as const;

const recipients = ["Equipe de suporte", "Departamento financeiro", "Sala de treinamento", "Equipe de desenvolvimento", "Recepção"];

async function main() {
  console.log("Iniciando seed demonstrativo do StockFlow...");

  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description, isActive: true },
      create: category,
    });
    categoryIds.set(category.name, saved.id);
  }

  const supplierIds: string[] = [];
  for (const supplier of suppliers) {
    const existing = await prisma.supplier.findFirst({ where: { email: supplier.email } });
    const saved = existing
      ? await prisma.supplier.update({ where: { id: existing.id }, data: { ...supplier, isActive: true } })
      : await prisma.supplier.create({ data: supplier });
    supplierIds.push(saved.id);
  }

  let productsCreated = 0;
  let movementsCreated = 0;

  for (let index = 0; index < products.length; index += 1) {
    const productData = products[index];
    if (!productData) continue;
    const [sku, name, description, categoryName, price, targetQuantity, minStock, unit, location] = productData;
    const categoryId = categoryIds.get(categoryName);
    if (!categoryId) {
      throw new Error(`Categoria demonstrativa não encontrada: ${categoryName}.`);
    }

    const existing = await prisma.product.findUnique({ where: { sku } });
    const product = existing
      ? await prisma.product.update({
          where: { id: existing.id },
          data: { name, description, price, minStock, unit, location, categoryId, isActive: true },
        })
      : await prisma.product.create({
          data: { sku, name, description, price, minStock, unit, location, categoryId, quantity: 0 },
        });
    if (!existing) productsCreated += 1;

    const alreadySeeded = await prisma.stockMovement.findFirst({
      where: { productId: product.id, notes: { contains: SEED_TAG } },
      select: { id: true },
    });
    if (alreadySeeded) continue;

    const supplierId = supplierIds[index % supplierIds.length];
    const recipient = recipients[index % recipients.length] ?? "Setor administrativo";
    if (!supplierId) throw new Error(`Fornecedor demonstrativo não encontrado para o produto ${sku}.`);
    const initialEntry = Math.max(targetQuantity, 1) + (index % 4) + 4;
    const demoExit = targetQuantity === 0 ? initialEntry : Math.max(0, (index % 5) + 1);
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() - (index % 25) - 2);
    const exitDate = new Date();
    exitDate.setDate(exitDate.getDate() - (index % 12));

    await prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: "ENTRY",
          quantity: initialEntry,
          supplierId,
          unitCost: Math.max(1, Number(price) * (0.62 + (index % 7) * 0.025)).toFixed(2),
          notes: `${SEED_TAG} Entrada inicial demonstrativa.`,
          createdAt: entryDate,
        },
      });
      if (demoExit > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "EXIT",
            quantity: demoExit,
            recipient,
            notes: `${SEED_TAG} Saída demonstrativa para ${recipient}.`,
            createdAt: exitDate,
          },
        });
      }
      await tx.product.update({ where: { id: product.id }, data: { quantity: initialEntry - demoExit } });
    });
    movementsCreated += demoExit > 0 ? 2 : 1;
  }

  console.log("Seed concluído.");
  console.log(`Categorias garantidas: ${categories.length}`);
  console.log(`Fornecedores garantidos: ${suppliers.length}`);
  console.log(`Produtos novos: ${productsCreated} (30 SKUs demonstrativos garantidos)`);
  console.log(`Movimentações demonstrativas criadas nesta execução: ${movementsCreated}`);
  console.log("Nenhum usuário, sessão ou registro fora dos SKUs demonstrativos foi removido.");
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao popular o banco demonstrativo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
