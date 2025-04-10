const Sequelize = require('sequelize');

const sequelize = new Sequelize('postgres', 'postgres', 'NikNik@2023', {
  host: 'db.tcspzguyqpxgxiilwqrv.supabase.co',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  query: { raw: true }
});

const Category = sequelize.define('Category', {
  category: Sequelize.STRING
});

const Item = sequelize.define('Item', {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE
});

Item.belongsTo(Category, { foreignKey: 'category' });

module.exports = {

  initialize: () => {
    return new Promise((resolve, reject) => {
      sequelize.sync()
        .then(() => resolve())
        .catch((err) => {
          console.error("Sequelize sync error:", err);
          reject("unable to sync the database");
        });
    });
  },

  getAllItems: () => {
    return new Promise((resolve, reject) => {
      Item.findAll()
        .then(data => resolve(data))
        .catch(() => reject("no results returned"));
    });
  },

  getItemsByCategory: (category) => {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: { category: category }
      })
        .then(data => resolve(data))
        .catch(() => reject("no results returned"));
    });
  },

  getItemsByMinDate: (minDateStr) => {
    return new Promise((resolve, reject) => {
      const { gte } = Sequelize.Op;
      Item.findAll({
        where: {
          postDate: {
            [gte]: new Date(minDateStr)
          }
        }
      })
        .then(data => resolve(data))
        .catch(() => reject("no results returned"));
    });
  },

  getItemById: (id) => {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: { id: id }
      })
        .then(data => resolve(data[0]))
        .catch(() => reject("no results returned"));
    });
  },

  addItem: (itemData) => {
    return new Promise((resolve, reject) => {
      itemData.published = itemData.published ? true : false;
      for (const prop in itemData) {
        if (itemData[prop] === "") itemData[prop] = null;
      }
      itemData.postDate = new Date();
      Item.create(itemData)
        .then(() => resolve())
        .catch(() => reject("unable to create post"));
    });
  },

  getPublishedItems: () => {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: { published: true }
      })
        .then(data => resolve(data))
        .catch(() => reject("no results returned"));
    });
  },

  getPublishedItemsByCategory: (category) => {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: {
          published: true,
          category: category
        }
      })
        .then(data => resolve(data))
        .catch(() => reject("no results returned"));
    });
  },

  getCategories: () => {
    return new Promise((resolve, reject) => {
      Category.findAll()
        .then(data => resolve(data))
        .catch(() => reject("no results returned"));
    });
  },

  addCategory: (categoryData) => {
    return new Promise((resolve, reject) => {
      for (const prop in categoryData) {
        if (categoryData[prop] === "") categoryData[prop] = null;
      }
      Category.create(categoryData)
        .then(() => resolve())
        .catch(() => reject("unable to create category"));
    });
  },

  deleteCategoryById: (id) => {
    return new Promise((resolve, reject) => {
      Category.destroy({
        where: { id: id }
      })
        .then(() => resolve())
        .catch(() => reject("unable to delete category"));
    });
  },

  deletePostById: (id) => {
    return new Promise((resolve, reject) => {
      Item.destroy({
        where: { id: id }
      })
        .then(() => resolve())
        .catch(() => reject("unable to delete post"));
    });
  }

};