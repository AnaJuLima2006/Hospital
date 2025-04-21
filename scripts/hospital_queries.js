// 1. Adicionar campo "em_atividade" para todos os médicos
// true = em atividade; false = inativo
db.medicos.updateMany(
  {},
  { $set: { em_atividade: true } }
);

// 2. Atualizar dois médicos como inativos (exemplo por CRM)
db.medicos.updateOne(
  { "documentos.crm": "SP123456" },
  { $set: { em_atividade: false } }
);
db.medicos.updateOne(
  { "documentos.crm": "RJ654321" },
  { $set: { em_atividade: false } }
);

// 3. Consultas de 2020 feitas sob convênio e valor médio
// Todas as consultas de 2020 com forma_pagamento "convênio"
db.consultas.find({
  data_consulta: {
    $gte: ISODate("2020-01-01T00:00:00Z"),
    $lt: ISODate("2021-01-01T00:00:00Z")
  },
  forma_pagamento: "convênio"
});

// Valor médio dessas consultas
db.consultas.aggregate([
  {
    $match: {
      data_consulta: {
        $gte: ISODate("2020-01-01T00:00:00Z"),
        $lt: ISODate("2021-01-01T00:00:00Z")
      },
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
