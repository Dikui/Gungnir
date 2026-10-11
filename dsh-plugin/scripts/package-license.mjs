// Include the canonical repository license in the npm package without keeping
// a second source copy. npm invokes this helper from prepack and postpack.
import { constants, copyFileSync, existsSync, readFileSync, unlinkSync } from 'node:fs'

const source = new URL('../../LICENSE', import.meta.url)
const target = new URL('../LICENSE', import.meta.url)
const action = process.argv[2]

if (action === 'prepare') {
  if (existsSync(target)) {
    if (!readFileSync(target).equals(readFileSync(source))) {
      throw new Error('Refusing to overwrite a package license that differs from the repository license')
    }
  } else {
    copyFileSync(source, target, constants.COPYFILE_EXCL)
  }
} else if (action === 'clean') {
  if (existsSync(target)) {
    if (!readFileSync(target).equals(readFileSync(source))) {
      throw new Error('Refusing to remove a package license that differs from the repository license')
    }
    unlinkSync(target)
  }
} else {
  throw new Error('Expected prepare or clean')
}
