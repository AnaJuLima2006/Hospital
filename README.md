# Hospital Vivare

# 🏥 Sistema de Gestão Hospitalar — MongoDB

Este repositório contém um conjunto de scripts e dados para gerenciamento de um hospital usando banco de dados MongoDB. O sistema cobre funcionalidades essenciais como cadastro de médicos e pacientes, registro de consultas e internações, controle de enfermagem e relatórios inteligentes.

## 📁 Estrutura

- `scripts/hospital_queries.js`: comandos em MongoDB Shell para atualizar e consultar dados.
- `dados/`: arquivos JSON de exemplo contendo registros reais de médicos, pacientes, consultas e internações.

## 📚 Funcionalidades

### 🔹 Médicos
Contém informações completas de médicos, incluindo especialidades, horários de atendimento, contatos e o campo `em_atividade` que indica se o profissional ainda está ativo no hospital.

### 🔹 Pacientes
Contém dados pessoais, convênios, alergias, medicamentos em uso e **histórico de consultas** recente.

### 🔹 Consultas
Registra atendimentos com:
- Diagnóstico, valor, status e forma de pagamento
- Receituário com múltiplos medicamentos

### 🔹 Internações
Inclui:
- Informações de entrada e alta
- Procedimentos, quarto, medicamentos, dieta especial
- Contato familiar e evolução diária
- Profissionais de enfermagem responsáveis

## 🧾 Consultas Inteligentes

- Valor médio de consultas sob convênio em 2020
- Consultas de maior e menor valor (sem convênio)
- Internações com alta pós-data prevista
- Total da internação (com cálculo do valor total)
- Internações feitas por médicos gastroenterologistas
- Consultas de menores de idade fora da especialidade pediatria
- Médicos com total de consultas realizadas
- Enfermeiros com mais de uma internação

--- 
**Banco de dados NoSQL otimizado para ambientes hospitalares.**
