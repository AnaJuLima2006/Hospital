# MongoDB Queries - Projeto Hospital Vivare


# 🏥 hospital_queries.js — README Detalhado

Este documento explica **linha por linha** o que cada comando do script `hospital_queries.js` faz, com o código completo incluso.

---

## ✅ 0. Marcar todos os médicos como ativos
```js
db.medicos.updateMany({}, { $set: { em_atividade: true } });
```
👉 Atualiza todos os documentos da coleção `medicos`, adicionando o campo `em_atividade` com valor `true`.

---

## ✅ 1. Marcar dois médicos como inativos
```js
db.medicos.updateOne({ "documentos.crm": "XE321569" }, { $set: { em_atividade: false } });
db.medicos.updateOne({ "documentos.crm": "PA963852" }, { $set: { em_atividade: false } });
```
👉 Atualiza dois médicos específicos, encontrados pelo CRM, e os marca como inativos (`em_atividade: false`).

---

## ✅ 2. Consultas de 2020 feitas com convênio e média dos valores
```js
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
      media_valor_bruto: { $avg: "$valor_consulta" }
    }
  },
  {
    $project: {
      _id: 0,
      media_valor: {
        $concat: [
          "R$ ",
          {
            $toString: {
              $round: ["$media_valor_bruto", 2]
            }
          }
        ]
      }
    }
  }
]);
```
- Filtra consultas de 2020 pagas com convênio (`$match`).
- Agrupa tudo e calcula a média (`$group`).
- Formata como string monetária no estilo `"R$ 145.50"` (`$project`).

---

## ✅ 3. Internações com alta efetiva após a data prevista
```js
db.internacoes.find({
  $expr: { $gt: ["$data_efetiva_alta", "$data_prevista_alta"] }
});
```
👉 Compara `data_efetiva_alta` com `data_prevista_alta` usando `$expr` e retorna as internações onde a alta foi atrasada.

---

## ✅ 4. Primeira consulta com receituário adicional
```js
db.consultas.find({
  "receituario.medicamentos.1": { $exists: true }
}).sort({ data_consulta: 1 }).limit(1);
```
👉 Busca a primeira consulta com mais de um medicamento no receituário (`.medicamentos[1]`), ordena por data e limita a 1.

---

## ✅ 5. Consultas de maior e menor valor (sem convênio)
```js
db.consultas.find({ forma_pagamento: { $ne: "convênio" } }).sort({ valor_consulta: -1 }).limit(1);
db.consultas.find({ forma_pagamento: { $ne: "convênio" } }).sort({ valor_consulta: 1 }).limit(1);
```
👉 Encontra a consulta mais cara e a mais barata, entre as que **não** foram pagas por convênio.

---

## ✅ 6. Internações com cálculo total da diária e número de internações por paciente
```js
db.internacoes.aggregate([
  {
    $lookup: {
      from: "pacientes",
      localField: "paciente_id",
      foreignField: "id_paciente",
      as: "paciente"
    }
  },
  { $unwind: "$paciente" },
  {
    $lookup: {
      from: "internacoes",
      let: { pid: "$paciente_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$paciente_id", "$$pid"] } } },
        { $count: "total" }
      ],
      as: "internacoes_do_paciente"
    }
  },
  {
    $addFields: {
      total_internacoes_paciente: {
        $cond: {
          if: { $gt: [{ $size: "$internacoes_do_paciente" }, 0] },
          then: { $arrayElemAt: ["$internacoes_do_paciente.total", 0] },
          else: 1
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      nome_paciente: "$paciente.nome",
      quarto_numero: "$quarto.numero",
      quarto_tipo: "$quarto.tipo",
      total_internacoes_paciente: 1,
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
```
👉 Essa consulta junta pacientes, conta quantas internações cada um teve e calcula os valores totais da internação.

---

## ✅ 7. Internações em quartos tipo “Apartamento”
```js
db.internacoes.find(
  { "quarto.tipo": "Apartamento" },
  { paciente_id: 1, procedimentos: 1, "quarto.tipo": 1, "quarto.numero": 1 }
);
```
👉 Traz internações que ocorreram em quartos do tipo **Apartamento**, com procedimentos e dados do quarto.

---

## ✅ 8. Consultas de menores de 18 anos cuja especialidade não seja Pediatria
```js
db.consultas.aggregate([
  {
    $lookup: {
      from: "pacientes",
      localField: "paciente_id",
      foreignField: "id_paciente",
      as: "paciente"
    }
  },
  { $unwind: "$paciente" },
  {
    $addFields: {
      idade_na_consulta: {
        $dateDiff: {
          startDate: "$paciente.data_nascimento",
          endDate: "$data_consulta",
          unit: "year"
        }
      }
    }
  },
  {
    $match: {
      idade_na_consulta: { $lt: 18 },
      tipo_consulta: { $ne: "Pediatria" }
    }
  },
  { $sort: { data_consulta: 1 } },
  {
    $project: {
      nome_paciente: "$paciente.nome",
      data_consulta: 1,
      tipo_consulta: 1,
      diagnostico: 1
    }
  }
]);
```
👉 Retorna consultas em que o paciente tinha menos de 18 anos na data da consulta e a especialidade não era Pediatria.

---

## ✅ 9. Internações com médicos gastroenterologistas em enfermaria
```js
db.internacoes.aggregate([
  {
    $lookup: {
      from: "medicos",
      localField: "medico_responsavel_id",
      foreignField: "documentos.crm",
      as: "medico"
    }
  },
  { $unwind: "$medico" },
  {
    $lookup: {
      from: "pacientes",
      localField: "paciente_id",
      foreignField: "id_paciente",
      as: "paciente"
    }
  },
  { $unwind: "$paciente" },
  {
    $match: {
      "medico.especialidade": "Gastroenterologia",
      "quarto.tipo": "Enfermaria"
    }
  },
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
```
👉 Filtra internações feitas por médicos da especialidade **Gastroenterologia**, em **enfermarias**, trazendo os dados da internação, paciente e médico.

---

## ✅ 10. Quantidade de consultas por médico (nome e CRM)
```js
db.consultas.aggregate([
  {
    $group: {
      _id: "$medico_id",
      total_consultas: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "medicos",
      localField: "_id",
      foreignField: "documentos.crm",
      as: "medico"
    }
  },
  { $unwind: "$medico" },
  {
    $project: {
      nome_medico: "$medico.nome",
      crm: "$_id",
      total_consultas: 1
    }
  }
]);
```
👉 Agrupa por CRM (`medico_id`) e mostra quantas consultas cada médico realizou.

---

## ✅ 11. Médicos com "Gabriel" no nome
```js
db.medicos.find({ nome: /Gabriel/i });
```
👉 Busca todos os médicos cujo nome contém "Gabriel" (case insensitive).

---

## ✅ 12. Enfermeiros com mais de uma internação + dados dessas internações
```js
db.internacoes.aggregate([
  { $unwind: "$enfermeiros_responsaveis" },
  {
    $group: {
      _id: "$enfermeiros_responsaveis.coren",
      nome: { $first: "$enfermeiros_responsaveis.nome" },
      total_internacoes: { $sum: 1 },
      internacoes: {
        $push: {
          id_internacao: "$id_internacao",
          data_entrada: "$data_entrada",
          data_efetiva_alta: "$data_efetiva_alta"
        }
      }
    }
  },
  {
    $match: {
      total_internacoes: { $gt: 1 }
    }
  }
]);
```
👉 Conta quantas internações cada enfermeiro participou e lista os dados das internações. Mostra apenas aqueles com mais de uma.

---

🎉 
