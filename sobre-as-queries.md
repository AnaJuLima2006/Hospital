# MongoDB Queries - Projeto Hospital

## 1. Adicionar coluna "em_atividade" aos médicos

### Enunciado:
Adicione uma coluna "em_atividade" à coleção de médicos.

### Código:
```js
db.medicos.updateMany({}, { $set: { em_atividade: true } });
```

### Explicação detalhada:
- `db.medicos`: seleciona a coleção de médicos.
- `updateMany({}, ...)`: aplica a atualização a todos os documentos (nenhum filtro).
- `$set: { em_atividade: true }`: adiciona ou atualiza o campo `em_atividade` como `true` (ativo).

---

## 2. Atualizar dois médicos como inativos

### Enunciado:
Atualize dois médicos para "inativos" com base no CRM.

### Código:
```js
db.medicos.updateOne({ "documentos.crm": "SP123456" }, { $set: { em_atividade: false } });
db.medicos.updateOne({ "documentos.crm": "RJ654321" }, { $set: { em_atividade: false } });
```

### Explicação detalhada:
- `updateOne(...)`: atualiza um único documento que atenda ao critério.
- `{ "documentos.crm": "SP123456" }`: busca o médico com CRM específico.
- `$set: { em_atividade: false }`: atualiza o campo `em_atividade` para indicar inatividade.

---

## 3. Consultas de 2020 com convênio e valor médio

### Enunciado:
Exiba todas as consultas de 2020 feitas com convênio e calcule o valor médio.

### Código:
```js
db.consultas.find({
  data_consulta: { $gte: ISODate("2020-01-01T00:00:00Z"), $lt: ISODate("2021-01-01T00:00:00Z") },
  forma_pagamento: "convênio"
});
```

### Explicação detalhada:
- `data_consulta: { $gte: ..., $lt: ... }`: filtra apenas as datas dentro de 2020.
- `forma_pagamento: "convênio"`: busca apenas consultas com convênio.

```js
db.consultas.aggregate([
  {
    $match: {
      data_consulta: { $gte: ISODate("2020-01-01T00:00:00Z"), $lt: ISODate("2021-01-01T00:00:00Z") },
      forma_pagamento: "convênio"
    }
  },
  {
    $group: {
      _id: null,
      media_valor: { $avg: "$valor_consulta" }
    }
  }
]);
```

### Explicação detalhada:
- `$match`: filtra os documentos conforme os critérios anteriores.
- `$group: { _id: null, media_valor: { $avg: "$valor_consulta" } }`: agrupa todos os documentos (por `_id: null`) e calcula a média dos valores das consultas.

---

## 4. Internações com alta maior que a prevista

### Código:
```js
db.internacoes.find({
  $expr: { $gt: ["$data_efetiva_alta", "$data_prevista_alta"] }
});
```

### Explicação detalhada:
- `$expr`: permite comparar dois campos do mesmo documento.
- `$gt: ["$data_efetiva_alta", "$data_prevista_alta"]`: verifica se a data de alta efetiva é posterior à prevista.

---

## 5. Primeira consulta com receituário adicional

### Código:
```js
db.consultas.find({ "receituario.adicional": { $exists: true } }).sort({ data_consulta: 1 }).limit(1);
```

### Explicação detalhada:
- `receituario.adicional: { $exists: true }`: busca consultas com campo preenchido.
- `.sort({ data_consulta: 1 })`: ordena pela data da mais antiga para a mais recente.
- `.limit(1)`: retorna apenas o primeiro resultado.

---

## 6. Consultas de maior e menor valor (sem convênio)

### Código:
```js
db.consultas.find({ forma_pagamento: { $ne: "convênio" } }).sort({ valor_consulta: -1 }).limit(1);
db.consultas.find({ forma_pagamento: { $ne: "convênio" } }).sort({ valor_consulta: 1 }).limit(1);
```

### Explicação detalhada:
- `$ne: "convênio"`: filtra consultas com outra forma de pagamento.
- `.sort({ valor_consulta: -1 })`: maior valor.
- `.sort({ valor_consulta: 1 })`: menor valor.

---

## 7. Cálculo total de internações

### Código:
```js
db.internacoes.aggregate([
  {
    $project: {
      paciente_id: 1,
      quarto: 1,
      dias_internacao: {
        $dateDiff: {
          startDate: "$data_entrada",
          endDate: "$data_efetiva_alta",
          unit: "day"
        }
      },
      valor_diario: "$quarto.valor_diario",
      total: {
        $multiply: [
          "$quarto.valor_diario",
          {
            $dateDiff: {
              startDate: "$data_entrada",
              endDate: "$data_efetiva_alta",
              unit: "day"
            }
          }
        ]
      }
    }
  }
]);
```

### Explicação detalhada:
- `$project`: cria novos campos no resultado.
- `$dateDiff`: calcula duração da internação.
- `$multiply`: custo total = dias * valor_diário.

---

## 8. Internações em "Apartamento"

### Código:
```js
db.internacoes.find({ "quarto.tipo": "Apartamento" }, { paciente_id: 1, procedimentos: 1, "quarto.numero": 1 });
```

### Explicação detalhada:
- Filtra quartos do tipo “Apartamento”.
- Exibe apenas campos necessários.

---

## 9. Consultas de menores de 18 fora da pediatria

### Código:
```js
db.consultas.aggregate([
  { $lookup: { from: "pacientes", localField: "paciente_id", foreignField: "id_paciente", as: "paciente" }},
  { $unwind: "$paciente" },
  { $addFields: {
    idade_na_consulta: { $dateDiff: { startDate: "$paciente.data_nascimento", endDate: "$data_consulta", unit: "year" } }
  }},
  { $match: { idade_na_consulta: { $lt: 18 }, tipo_consulta: { $ne: "Pediatria" } }},
  { $sort: { data_consulta: 1 }},
  { $project: { nome_paciente: "$paciente.nome", data_consulta: 1, tipo_consulta: 1, diagnostico: 1 } }
]);
```

### Explicação detalhada:
- Junta com pacientes, calcula idade e filtra os casos de menores de idade não atendidos em Pediatria.

---

## 10. Internações feitas por gastroenterologistas em enfermarias

### Código:
```js
db.internacoes.aggregate([
  { $lookup: { from: "medicos", localField: "medico_responsavel_id", foreignField: "documentos.crm", as: "medico" }},
  { $unwind: "$medico" },
  { $match: { "medico.especialidade": "Gastroenterologia", "quarto.tipo": "Enfermaria" }},
  { $project: { nome_paciente: 1, nome_medico: "$medico.nome", procedimentos: 1, quarto: 1 } }
]);
```

### Explicação detalhada:
- Filtra internações feitas por médicos gastro em quartos do tipo enfermaria.

---

## 11. Quantidade de consultas por médico

### Código:
```js
db.consultas.aggregate([
  { $group: { _id: "$medico_id", total_consultas: { $sum: 1 } }},
  { $lookup: { from: "medicos", localField: "_id", foreignField: "documentos.crm", as: "medico" }},
  { $unwind: "$medico" },
  { $project: { nome_medico: "$medico.nome", crm: "$_id", total_consultas: 1 } }
]);
```

### Explicação detalhada:
- Agrupa por médico e conta quantas consultas cada um realizou.

---

## 12. Médicos com "Gabriel" no nome

### Código:
```js
db.medicos.find({ nome: /Gabriel/i });
```

### Explicação detalhada:
- Regex que busca “Gabriel” ignorando maiúsculas e minúsculas.

---

## 13. Enfermeiros com mais de uma internação

### Código:
```js
db.internacoes.aggregate([
  { $unwind: "$enfermeiros_responsaveis" },
  { $group: {
    _id: "$enfermeiros_responsaveis.coren",
    nome: { $first: "$enfermeiros_responsaveis.nome" },
    total_internacoes: { $sum: 1 }
  }},
  { $match: { total_internacoes: { $gt: 1 } }}
]);
```

### Explicação detalhada:
- Conta quantas internações cada enfermeiro participou e retorna os que têm mais de uma.
