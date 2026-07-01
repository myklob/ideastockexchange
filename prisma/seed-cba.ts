import { prisma } from '../src/lib/prisma'
import { ensureSampleCBAs } from '../src/features/cost-benefit-analysis/data/cba-data'

async function main() {
  console.log('Seeding cost-benefit analyses...')
  const inserted = await ensureSampleCBAs()
  const total = await prisma.cBAAnalysis.count()
  console.log(
    inserted > 0
      ? `Inserted ${inserted} sample CBA(s). Total: ${total}.`
      : `CBA table already populated (${total}); nothing inserted.`,
  )
  console.log('CBA seed completed!')
}

main()
  .catch((e) => {
    console.error('Error during CBA seed:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
