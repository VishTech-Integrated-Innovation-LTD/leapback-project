"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importing APIs handlers/controllers
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
router.get('', user_controller_1.getAllUsers);
router.get('/:id', user_controller_1.getUserById);
router.put('/:id', user_controller_1.updateUser);
router.delete('/:id', user_controller_1.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map