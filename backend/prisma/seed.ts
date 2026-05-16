import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      email,
      password: hashedPassword,
    },
  });

  console.log({ user });

  // Add Test Fixtures
  console.log('Creating seed fixtures...');

  // 1. Create a Company
  const company = await prisma.company.upsert({
    where: { cnpj: '00000000000191' },
    update: {},
    create: {
      internalCode: '001',
      corporateName: 'Empresa Teste S/A',
      tradeName: 'Empresa Teste',
      cnpj: '00000000000191',
      city: 'São Paulo - SP',
      taxRegime: 'SIMPLES_NACIONAL',
      activities: ['SERVICO', 'COMERCIO'],
      hasMovement: true,
      hasOutboundDocs: true,
      hasInboundDocs: true,
      taxSimplesNacional: true,
    },
  });

  console.log({ company: company.tradeName });

  // 2. Create an Obligation
  let obligation = await prisma.obligation.findFirst({
    where: { name: 'DAS Simples Nacional' },
  });

  if (!obligation) {
    obligation = await prisma.obligation.create({
      data: {
        name: 'DAS Simples Nacional',
        description: 'Documento de Arrecadação do Simples Nacional',
        type: 'FEDERAL',
        periodicity: 'MENSAL',
        dueDay: 20,
        isActive: true,
        conditions: {
          create: [
            {
              field: 'taxRegime',
              operator: 'EQUALS',
              value: 'SIMPLES_NACIONAL',
            },
            {
              field: 'hasMovement',
              operator: 'EQUALS',
              value: 'true',
            }
          ]
        }
      },
    });
  }

  console.log({ obligation: obligation.name });
  
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
