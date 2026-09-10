import { configApp } from '@adonisjs/eslint-config'
import securityPlugin from 'eslint-plugin-security'

export default configApp(securityPlugin.configs.recommended)
