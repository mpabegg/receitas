# Receitas

Catálogo estático de receitas, pronto para GitHub Pages.

## O que tem

- Interface em português
- Sem build e sem dependências externas
- Busca por nome ou ingrediente
- Detalhes por receita com ingredientes
- Cache offline com service worker
- Ajuda para adicionar o catálogo à tela inicial do telefone

## Como editar

- Altere `recipes.json` para trocar ou adicionar receitas
- Ajuste textos e cores em `styles.css`
- Se mudar arquivos estáticos, revise `sw.js` para o cache

Formato mínimo de uma receita:

```json
{
  "id": "omelete",
  "name": "Omelete",
  "ingredients": ["Ovos", "Queijo", "Sal"]
}
```

## Observação

Os exemplos são genéricos e fáceis de substituir.
