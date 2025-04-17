
# MongoDB Queries - Projeto Hospital Vivare

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
- `"receituario.adicional": { $exists: true }`: busca consultas que têm esse campo preenchido.
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
- `$ne: "convênio"`: filtra as consultas com qualquer forma de pagamento que não seja convênio.
- `.sort({ valor_consulta: -1 })`: ordena do valor mais alto ao mais baixo.
- `.sort({ valor_consulta: 1 })`: ordena do mais baixo ao mais alto.

---
