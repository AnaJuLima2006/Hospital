// 0. Adicionar campo "em_atividade" para todos os médicos
// true = em atividade; false = inativo
db.medicos.updateMany(
  {},
  { $set: { em_atividade: true } }
);

// 1. Atualizar dois médicos como inativos (exemplo por CRM)
db.medicos.updateOne(
  { "documentos.crm": "SP123456" },
  { $set: { em_atividade: false } }
);
db.medicos.updateOne(
  { "documentos.crm": "RJ654321" },
  { $set: { em_atividade: false } }
);

// 2. Todos os dados e o valor médio das consultas do ano de 2020 e das que foram feitas sob convênio. 
db.consultas.find({
  data_consulta: {
    $gte: ISODate("2020-01-01T00:00:00Z"),
    $lt: ISODate("2021-01-01T00:00:00Z")
  },
  forma_pagamento: "convênio"
});

// Valor médio
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

// 3. Internções que tiveram alta efetiva depois da data prevista.
db.internacoes.find({
  $expr: { $gt: ["$data_efetiva_alta", "$data_prevista_alta"] }
});

// 4. Receituário completo da primeira consulta registrada com receituário adicional.

//Aparece tudo
db.consultas.find({
  "receituario.medicamentos.1": { $exists: true }
}).sort({ data_consulta: 1 }).limit(1);

//Aparece só o receituário
db.consultas.find(
  {
    "receituario.medicamentos.1": { $exists: true }
  },
  {
    _id: 0,
    receituario: 1
  }
).sort({ data_consulta: 1 }).limit(1);


// 4. Consulta de maior e menor valor (sem convênio)
// Maior
db.consultas.find({ forma_pagamento: { 
  $ne: "convênio" 
} }).sort({ valor_consulta: -1 }).limit(1);

// Menor
db.consultas.find({ forma_pagamento: { 
  $ne: "convênio" 
} }).sort({ valor_consulta: 1 }).limit(1);

// 5. Internações com cálculo total com base nos dias e valor diário
db.internacoes.aggregate([
  // Juntando os dados dos pacientes
  {
    $lookup: {
      from: "pacientes",
      localField: "paciente_id",
      foreignField: "id_paciente",
      as: "paciente"
    }
  },
  { $unwind: "$paciente" },

  // Projeção e cálculo
  {
    $project: {
      _id: 0,
      nome_paciente: "$paciente.nome",
      quarto_numero: "$quarto.numero",
      quarto_tipo: "$quarto.tipo",
      data_entrada: 1,
      data_efetiva_alta: 1,
      dias_internacao: {
        $dateDiff: {
          startDate: "$data_entrada",
          endDate: "$data_efetiva_alta",
          unit: "day"
        }
      },
      valor_diario: "$quarto.valor_diario",
      total_bruto: {
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
      },
      total_formatado: {
        $concat: [
          "R$ ",
          {
            $toString: {
              $round: [
                {
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
                },
                2
              ]
            }
          }
        ]
      }
    }
  }
]);

// 6. Internações em quartos tipo “Apartamento” com procedimentos e nº do quarto
db.internacoes.find(
  { "quarto.tipo": "Apartamento" },
  { paciente_id: 1, procedimentos: 1,"quarto.tipo": 1, "quarto.numero": 1 }
);

// 7. Consultas de menores de 18 anos fora da pediatria, com nome do paciente e ordenadas por data
db.consultas.aggregate([
  { $lookup: { from: "pacientes", localField: "paciente_id", foreignField: "id_paciente", as: "paciente" }},
  { $unwind: "$paciente" },
  { $addFields: {
      idade_na_consulta: {
        $dateDiff: {
          startDate: "$paciente.data_nascimento",
          endDate: "$data_consulta",
          unit: "year"
        }
      }
  }},
  { $match: {
    idade_na_consulta: { $lt: 18 },
    tipo_consulta: { $ne: "Pediatria" }
  }},
  { $sort: { data_consulta: 1 }},
  { $project: {
    nome_paciente: "$paciente.nome",
    data_consulta: 1,
    tipo_consulta: 1,
    diagnostico: 1
  }}
]);

// 8. Internações feitas por médicos gastroenterologistas em enfermaria
db.internacoes.aggregate([
  // Traz dados do médico
  {
    $lookup: {
      from: "medicos",
      localField: "medico_responsavel_id",
      foreignField: "documentos.crm",
      as: "medico"
    }
  },
  { $unwind: "$medico" },

  // Traz dados do paciente
  {
    $lookup: {
      from: "pacientes",
      localField: "paciente_id",
      foreignField: "id_paciente",
      as: "paciente"
    }
  },
  { $unwind: "$paciente" },

  // Filtro: gastro + enfermaria
  {
    $match: {
      "medico.especialidade": "Gastroenterologia",
      "quarto.tipo": "Enfermaria"
    }
  },

  // Projeção final
  {
    $project: {
      nome_paciente: "$paciente.nome",
      nome_medico: "$medico.nome",
      procedimentos: 1,
      quarto: 1,
      data_entrada: 1,
      data_prevista_alta: 1,
      data_efetiva_alta: 1
    }
  }
]);

// 9. Total de consultas feitas por médico (com nome e CRM)
db.consultas.aggregate([
  { $group: {
    _id: "$medico_id",
    total_consultas: { $sum: 1 }
  }},
  { $lookup: {
    from: "medicos",
    localField: "_id",
    foreignField: "documentos.crm",
    as: "medico"
  }},
  { $unwind: "$medico" },
  { $project: {
    nome_medico: "$medico.nome",
    crm: "$_id",
    total_consultas: 1
  }}
]);

// 10. Médicos com nome contendo “Gabriel”
db.medicos.find({ nome: /Gabriel/i });

// 11. Enfermeiros com mais de uma internação
db.internacoes.aggregate([
  { $unwind: "$enfermeiros_responsaveis" },
  { $group: {
    _id: "$enfermeiros_responsaveis.coren",
    nome: { $first: "$enfermeiros_responsaveis.nome" },
    total_internacoes: { $sum: 1 }
  }},
  { $match: { total_internacoes: { $gt: 1 } }}
]);
