<template>
  <div class="calculator-block">
    <form id="calculator" class="form-signin" @submit="handleSubmit($event)">
        <h1 class="h3 mb-3 font-weight-normal">Калькулятор</h1>
        <label for="cost" class="sr-only">Объявленная стоимость, руб.</label>
        <input
          id="cost"
          class="form-control"
          type="text"
          autocomplete="off"
          v-bind:class="classObject"
          v-bind:value="cost"
          @input="handleCostInput($event)"
          placeholder="Объявленная стоимость, руб."
          required autofocus
          >
        <label for="passInOffice" class="sr-only">Сдать в отделении</label>
        <select
          class="form-control"
          id="passInOffice"
          v-model="passInOffice"
          @change="handlePassInOfficeSelect($event)">
          <option disabled value="">Сдать в отделении</option>
          <option v-for="city in passInOfficeCities" v-bind:value="city.value">{{ city.text }}</option>
        </select>
        <label for="getInOffice" class="sr-only">Получить в отделении</label>
        <select
          id="getInOffice"
          class="form-control"
          v-model="getInOffice"
          @change="handleGetInOfficeSelect($event)">
          <option disabled value="">Получить в отделении</option>
          <option v-for="city in getInOfficeCities" v-bind:value="city.value" v-bind:disabled="city.disabled == 'Y'">{{ city.text }}</option>
        </select>
        <div class="checkbox mb-3">
          <label class="form-check-label" for="insureCargo">
          <input
              id="insureCargo"
              type="checkbox"
              :value="insureCargo"
              v-model="insureCargoStatus"
              v-bind:disabled="insureCargoLock"
              @change="handleInsureCargo($event)">
          Застраховать груз&nbsp;&nbsp;&nbsp;<span v-bind:class="{notactive: insureCargoCostLock}">+{{ insureCargoCost }} {{ currency }}</span>
          </label>
        </div>
        <div id="resultBlock">
          <div v-if="loader"><img src="./assets/loader.gif" alt="Пожалуйста, ждите" /></div>
          <div v-else-if="isSubmitDisabled">
              <img src="./assets/exclamation_mark.png" width="50" height="43" alt="" border="0" />
              <p>Для расчета стоимости заполните, пожалуйста, все обязательные поля.</p>
          </div>
          <div v-else>
              <div id="result" v-if="errors.length == 0">
                <h2 class="h3 mb-3 font-weight-normal">Сумма: {{ full_result }} {{ currency }}</h2>
                <hr />
                <ul>
                    <li v-for="item in detail_results">
                      {{ item }}
                    </li>
                </ul>
              </div>
              <div id="error" v-if="errors.length > 0">
                <h2 class="h3 mb-3 font-weight-normal">Ошибка:</h2>
                <hr />
                <ul>
                    <li v-for="error in errors">
                      {{ error }}
                    </li>
                </ul>
              </div>
          </div>
        </div>
    </form>
  </div>
</template>
<script>
  import {
      removeSpaces,
      removeNotInteger,
      sumSplit,
      validateCost
  } from './utils/validation.js'

  export default {
      data() {
          return {
              url: 'http://denwistmai.temp.swtest.ru/calculator/server/api.php',
              currency: 'руб.',
              isDanger: false,
              loader: false,
              errors: [],
              full_result: '',
              detail_results: [],
              passInOfficeCities: [],
              getInOfficeCities: [],
              insureCargo: 0,
              insureCargoStatus: false,
              insureCargoLock: false,
              insureCargoCost: '',
              insureCargoCostLock: false,
              cost: '',
              passInOffice: '',
              getInOffice: ''
          }
      },
      created: function() {
          this.request(this.url + '?ACTION=DIRECTION', this.callbackDirection, false)
      },
      methods: {


          callbackSubmit: function(value = null, errors = null) {
              this.errors = [];
              if (errors === null) {
                  try {

                      if (value.errors && value.errors.length > 0) {
                          for (let eKey in value.errors) {
                              this.errors.push(value.errors[eKey]);
                          }
                      } else {
                          this.full_result = sumSplit(value.cost);
                          this.detail_results = [];
                          for (let key in value.cost_detail) {
                              if (value.cost_detail[key].name && value.cost_detail[key].value) {
                                  this.detail_results.push(
                                      value.cost_detail[key].name + ': ' + sumSplit(value.cost_detail[key].value) + ' ' + this.currency
                                  );
                              }
                          }
                      }

                  } catch (e) {
                      this.errors.push("Не удалось обработать данные с сервера: " + e.message);
                  }
              } else {
                  this.errors.push(errors);
              }
          },
          callbackDirection: function(value = null, errors = null) {
              this.errors = [];
              if (errors === null) {
                  try {
                      this.passInOfficeCities = value.pass_in_office; // Города для сдачи товара
                      this.getInOfficeCities = value.get_in_office; // Города для получения товара
                  } catch (e) {
                      this.errors.push("Не удалось обработать данные с сервера: " + e.message);
                  }
              } else {
                  this.errors.push(errors);
              }
          },
          callbackInsurance: function(value = null, errors = null) {
              this.errors = [];
              if (errors === null) {
                  try {
                      let insureCargoCost = (value.cost == undefined) ? 0 : parseFloat(value.cost);
                      let insureCargoRequired = (value.required == undefined) ? 'N' : value.required;
                      this.insureCargoLock = Boolean(insureCargoRequired == 'Y');
                      if (this.insureCargoLock) {
                          this.insureCargoStatus = this.insureCargoLock;
                      }
                      this.insureCargoCostLock = Boolean(this.insureCargoStatus == false);
                      this.insureCargoCost = sumSplit(insureCargoCost);

                  } catch (e) {
                      this.errors.push("Не удалось обработать данные с сервера: " + e.message);
                  }
              } else {
                  this.errors.push(errors);
              }
          },

          // Стоимость груза, руб.
          handleCostInput: function(e) {
              e.target.value = removeSpaces(e.target.value); // remove separating spaces
              if (validateCost(e.target.value)) {
                  this.isDanger = false;
                  this.cost = e.target.value;
                  this.cost = sumSplit(this.cost); // add separating spaces
                  this.sendData();

                  // Обновим страхование
                  this.request(
                      this.url +
                      '?ACTION=INSURANCE' +
                      '&CARGO_COST=' + removeSpaces(this.cost),
                      this.callbackInsurance,
                      false
                  )

              } else {
                  this.isDanger = true;
                  e.target.value = removeNotInteger(e.target.value);
                  this.cost = e.target.value;
                  this.cost = sumSplit(this.cost); // add separating spaces
                  var self = this;
                  setTimeout(function() {
                      self.isDanger = false;
                  }, 600);
              }
          },


          // Сдать в отделении
          handlePassInOfficeSelect: function(e) {
              this.sendData()
          },
          // Получить в отделении
          handleGetInOfficeSelect: function() {
              //this.lastDirection = 'get_in_office';
              this.sendData()
          },
          // Застраховать груз
          handleInsureCargo: function() {
              this.sendData()
          },


          // Получение с сервера стоимость перевозки
          sendData() {
              if (!this.isSubmitDisabled) {
                  this.request(
                      this.url +
                      '?ACTION=SUBMIT' +
                      '&CARGO_COST=' + removeSpaces(this.cost) +
                      '&PASS_IN_OFFICE=' + (this.passInOffice ? parseInt(this.passInOffice, 10) : 0) +
                      '&GET_IN_OFFICE=' + (this.getInOffice ? parseInt(this.getInOffice, 10) : 0) +
                      '&INSURE_CARGO=' + ((this.insureCargoStatus) ? 'Y' : 'N')
                      //+ '&LAST_DIRECTION=' + (this.lastDirection || '')
                      ,
                      this.callbackSubmit,
                      true
                  )
              }
          },

          // Запрос на сервер с обратным вызовом фукции
          request: function(url, callBackFunction, showLoader = false) {

              this.loader = (showLoader) ? true : this.loader;

              var req = (window.XMLHttpRequest) ?
                  new XMLHttpRequest() // for modern browsers
                  :
                  new ActiveXObject("Microsoft.XMLHTTP"); // for old IE browsers

              req.onreadystatechange = function(vm) {
                  if (this.readyState === XMLHttpRequest.DONE) {

                      if (this.status === 200) {

                          try {
                              var json = JSON.parse(this.responseText);
                              callBackFunction(json, null);
                          } catch (e) {
                              callBackFunction(
                                  null,
                                  ["Не удалось обработать данные с сервера: " + e.message]
                              );
                          }

                      } else {
                          callBackFunction(
                              null,
                              ["Не удалось получить данные с сервера"]
                          );
                      }

                      vm.loader = (showLoader) ? false : vm.loader;
                  }
              }.bind(req, this);

              req.open("GET", url);
              req.send();
          }
      },
      computed: {

          classObject: function() {
              return {
                  'is-danger': this.isDanger
              }
          },
          isSubmitDisabled: function() {
              return !Boolean(
                  this.cost && validateCost(removeSpaces(this.cost)) &&
                  parseInt(this.passInOffice || 0, 10) > 0 &&
                  parseInt(this.getInOffice || 0, 10) > 0
              )
          }
      }
  }
</script>
<style scoped lang="sass">
.calculator-block
  width: 100%
.calculator-block{width: 100%;}
.form-signin
  width: 100%
  min-height: 400px
  max-width: 430px
  padding: 15px
  margin: auto
  .checkbox
    font-weight: 400
  .form-control
    position: relative
    box-sizing: border-box
    height: auto
    padding: 10px
    font-size: 16px
    &:focus
      z-index: 2
  input
    &[type="email"]
      margin-bottom: -1px
      border-bottom-right-radius: 0
      border-bottom-left-radius: 0
    &[type="password"]
      margin-bottom: 10px
      border-top-left-radius: 0
      border-top-right-radius: 0

.notactive
  color: #aaa

#resultBlock
  display: inline-block
  width: 100%
  margin-top: 30px
  min-height: 200px

#calculator
  .form-control
    position: relative
    margin: 5px
  .is-danger
    outline-color: red
    -webkit-animation: shake .6s linear
    animation: shake .6s linear

@-webkit-keyframes shake
  0%
    left: -10px

  16%
    left: 9px

  33%
    left: -6px

  50%
    left: 5px

  66%
    left: -2px

  83%
    left: 1px

  100%
    left: 0px
</style>
<style lang="sass">
html
  height: 100%

body
  height: 100%
  display: -ms-flexbox
  display: flex
  -ms-flex-align: center
  align-items: center
  padding-top: 40px
  padding-bottom: 40px
  background-color: #f5f5f5
</style>
