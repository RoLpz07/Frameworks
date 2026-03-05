const uid = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "id-" + Math.random().toString(16).slice(2);
};

const emptyRecipe = { titulo: "", ingredientes: "", pasos: "" };

function RecipeForm(props) {
  const draft = props.draft;
  const onChange = props.onChange;
  const onSubmit = props.onSubmit;
  const editing = props.editing;
  const onCancel = props.onCancel;

  return React.createElement(
    "form",
    { onSubmit: onSubmit, className: "panel" },
    React.createElement("h1", null, "Recetario"),
    React.createElement("p", { className: "muted" }, "Crea y edita recetas r\u00e1pidas."),

    React.createElement("label", null, "T\u00edtulo"),
    React.createElement("input", {
      value: draft.titulo,
      onChange: function (e) {
        onChange(Object.assign({}, draft, { titulo: e.target.value }));
      },
      required: true,
    }),

    React.createElement("label", null, "Ingredientes (uno por l\u00ednea)"),
    React.createElement("textarea", {
      value: draft.ingredientes,
      onChange: function (e) {
        onChange(Object.assign({}, draft, { ingredientes: e.target.value }));
      },
      placeholder: "Harina\nHuevos\nLeche",
    }),

    React.createElement("label", null, "Pasos"),
    React.createElement("textarea", {
      value: draft.pasos,
      onChange: function (e) {
        onChange(Object.assign({}, draft, { pasos: e.target.value }));
      },
      placeholder: "Mezclar\nHornear 20 min",
    }),

    React.createElement(
      "div",
      { className: "actions" },
      editing &&
        React.createElement(
          "button",
          { type: "button", className: "btn-ghost", onClick: onCancel },
          "Cancelar"
        ),
      React.createElement(
        "button",
        { type: "submit", className: "btn-primary" },
        editing ? "Actualizar" : "Agregar"
      )
    )
  );
}

function RecipeList(props) {
  const recipes = props.recipes;
  const onEdit = props.onEdit;
  const onDelete = props.onDelete;

  if (!recipes.length) {
    return React.createElement(
      "p",
      { className: "muted" },
      "A\u00fan no hay recetas, agrega la primera."
    );
  }

  return React.createElement(
    "div",
    { className: "grid" },
    recipes.map(function (r) {
      return React.createElement(
        "article",
        { key: r.id, className: "card" },
        React.createElement(
          "div",
          { className: "card-header" },
          React.createElement("span", { className: "tag" }, r.titulo || "Sin t\u00edtulo"),
          React.createElement(
            "div",
            { className: "actions" },
            React.createElement(
              "button",
              { className: "btn-ghost", onClick: function () { onEdit(r); } },
              "Editar"
            ),
            React.createElement(
              "button",
              { className: "btn-danger", onClick: function () { onDelete(r.id); } },
              "Borrar"
            )
          )
        ),
        React.createElement(
          "div",
          { className: "card-body" },
          React.createElement("strong", null, "Ingredientes"),
          React.createElement("pre", null, r.ingredientes || "\u2014"),
          React.createElement("strong", null, "Pasos"),
          React.createElement("pre", null, r.pasos || "\u2014")
        )
      );
    })
  );
}

function App() {
  const stateRecipes = React.useState([]);
  const recipes = stateRecipes[0];
  const setRecipes = stateRecipes[1];

  const stateDraft = React.useState(Object.assign({}, emptyRecipe));
  const draft = stateDraft[0];
  const setDraft = stateDraft[1];

  const stateEditing = React.useState(null);
  const editingId = stateEditing[0];
  const setEditingId = stateEditing[1];

  const handleSubmit = function (e) {
    e.preventDefault();
    if (!draft.titulo.trim()) return;

    if (editingId) {
      setRecipes(function (list) {
        return list.map(function (r) {
          return r.id === editingId ? Object.assign({}, draft, { id: editingId }) : r;
        });
      });
    } else {
      setRecipes(function (list) {
        return [Object.assign({}, draft, { id: uid() })].concat(list);
      });
    }
    setDraft(Object.assign({}, emptyRecipe));
    setEditingId(null);
  };

  const handleEdit = function (recipe) {
    setDraft({ titulo: recipe.titulo, ingredientes: recipe.ingredientes, pasos: recipe.pasos });
    setEditingId(recipe.id);
  };

  const handleDelete = function (id) {
    setRecipes(function (list) {
      return list.filter(function (r) { return r.id !== id; });
    });
  };

  const handleCancel = function () {
    setDraft(Object.assign({}, emptyRecipe));
    setEditingId(null);
  };

  return React.createElement(
    "main",
    null,
    React.createElement(RecipeForm, {
      draft: draft,
      onChange: setDraft,
      onSubmit: handleSubmit,
      onCancel: handleCancel,
      editing: Boolean(editingId),
    }),
    React.createElement(RecipeList, {
      recipes: recipes,
      onEdit: handleEdit,
      onDelete: handleDelete,
    })
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
