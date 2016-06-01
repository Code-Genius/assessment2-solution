'use strict';

var db = require('./database');
var Sequelize = require('sequelize');
var Promise = require('bluebird');

// Make sure you have `postgres` running!

var Task = db.define('Task', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    complete: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    due: Sequelize.DATE
}, {
    //---------VVVV---------  your code below  ---------VVV----------
    getterMethods: {
        timeRemaining: function() {
            if (this.due === undefined) {
                return Infinity
            } else {
                return this.due - new Date()
            }
        },
        overdue: function() {
            if (0 > this.due - new Date() && this.complete !== true) {
                return true
            } else {
                return false
            }
        }
    },
    classMethods: {
        clearCompleted: function() {
            return Task.findAll({
                    where: {
                        complete: true
                    }
                })
                .then(function(tasks) {
                    var taskspromise = [];
                    tasks.forEach(function(task) {
                        taskspromise.push(task.destroy());
                    })
                    return Promise.all(taskspromise)
                })
        },
        completeAll: function() {
            return Task.findAll({
                    where: {
                        complete: false
                    }
                })
                .then(function(tasks) {
                    var taskspromise = [];
                    tasks.forEach(function(task) {
                        taskspromise.push(task.update({
                            complete: true
                        }))
                    })
                    return Promise.all(taskspromise)
                })
        }
    },
    instanceMethods: {
        addChild: function(task) {
            return Task.create({
                name: task.name,
                parentId: this.id
            })
        },
        getChildren: function() {
            return Task.findAll({
                where: {
                    parentId: this.id
                }
            })
        },
        getSiblings: function() {
            var that = this;
            return Task.findAll({
                    where: {
                        parentId: this.parentId
                    }
                })
                .then(function(tasks) {
                    var newTasks = tasks.filter(function(task) {
                        return task.id !== that.id
                    })
                    return Promise.all(newTasks)
                })
        }
    },
    hooks: {
      beforeDestroy: function(task){
        //doesn't always pass spec for some reason
        Task.findAll({
          where: {
            parentId: task.id
          }
        })
        .then(function(tasks){
          // console.log(tasks.length)
          // var taskspromise = [];
          tasks.forEach(function(task){
            task.destroy()
          })
          // return Promise.all(taskspromise)
        })
      }
    }




    //---------^^^---------  your code above  ---------^^^----------
});

Task.belongsTo(Task, { as: 'parent' });





module.exports = Task;
