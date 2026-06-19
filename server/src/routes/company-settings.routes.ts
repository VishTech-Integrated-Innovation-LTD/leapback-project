import { Router } from "express";

// Importing APIs handlers/controllers
import {
   getCompanySettings,
  updateCompanySettings,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setDefaultBankAccount
} from '../controllers/company-settings.controller'

// Importing middleware
import authenticate from "../middleware/auth.middleware";

const router = Router();


// ======================
// PROTECT ALL ROUTES
// ======================
router.use(authenticate); 



router.get('', getCompanySettings);
router.put('', updateCompanySettings);
router.post('/bank-accounts',   addBankAccount);
router.post('/bank-accounts/:accountId',   updateBankAccount);
router.post('/bank-accounts/:accountId',   deleteBankAccount);
router.post('/bank-accounts/:accountId/default',   setDefaultBankAccount);





export default router;








