import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import {
  startAddExpense,
  addExpense,
  startEditExpense,
  editExpense,
  startRemoveExpense,
  removeExpense,
  startSetExpenses,
  setExpenses,
} from '../../actions/expenses'
import expenses from '../fixtures/expenses'
import database from '../../firebase/firebase'

// have to provide our thunk middleware to mock store
const createMockStore = configureMockStore([thunk])

const uid = 'testUid'
const defaultAuthState = { auth: { uid } }

beforeEach((done) => {
  const expensesData = {}
  expenses.forEach(({ id, description, note, amount, createdAt }) => {
    expensesData[id] = { description, note, amount, createdAt }
  })
  database
    .ref(`users/${uid}/expenses`)
    .set(expensesData)
    .then(
      () => done(), // Make sure no test cases run before this
    )
})

test('should set up remove expense action object', () => {
  const action = removeExpense({ id: '123abc' })
  expect(action).toEqual({
    // use toEqual() to compare objects
    type: 'REMOVE_EXPENSE',
    id: '123abc',
  })
})

test('should remove expenses from firebase', (done) => {
  const expense = expenses[0]
  const store = createMockStore(defaultAuthState)

  store.dispatch(startRemoveExpense(expense)).then(() => {
    const actions = store.getActions()
    expect(actions[0]).toEqual({
      type: 'REMOVE_EXPENSE',
      id: expense.id,
    })
    return database
      .ref(`users/${uid}/expenses/${expense.id}`)
      .once('value')
      .then((snapshot) => {
        expect(snapshot.val()).toEqual(null) // returns null if nothing found
        done()
      })
  })
})

test('should set up edit expense object', () => {
  const action = editExpense('abc123', { date: 666 })
  expect(action).toEqual({
    type: 'EDIT_EXPENSE',
    id: 'abc123',
    updates: {
      date: 666,
    },
  })
})

test('should edit expense from firebase', (done) => {
  const store = createMockStore(defaultAuthState)
  const id = expenses[0].id
  const updates = { amount: 666 }

  store.dispatch(startEditExpense(id, updates)).then(() => {
    const actions = store.getActions()

    expect(actions[0]).toEqual({
      type: 'EDIT_EXPENSE',
      id,
      updates,
    })
    return database
      .ref(`users/${uid}/expenses/${id}`)
      .once('value')
      .then((snapshot) => {
        expect(snapshot.val().amount).toBe(updates.amount)
        done()
      })
  })
})

test('should setup add expense action object with provided values,', () => {
  const action = addExpense(expenses[1])
  expect(action).toEqual({
    type: 'ADD_EXPENSE',
    expense: expenses[1],
  })
})

test('should add expense to database and store', (done) => {
  const store = createMockStore(defaultAuthState)
  const expenseData = {
    description: 'Groceries',
    amount: 10,
    note: '',
    createdAt: 1000,
  }

  store
    .dispatch(startAddExpense(expenseData))
    .then(() => {
      const actions = store.getActions() // our mock store actions
      expect(actions[0]).toEqual({
        type: 'ADD_EXPENSE',
        expense: {
          id: expect.any(String),
          ...expenseData,
        },
      })

      return database.ref(`users/${uid}/expenses/${actions[0].expense.id}`).once('value')
    })
    .then((snapshot) => {
      expect(snapshot.val()).toEqual(expenseData)
      done() // Wait for the first callback to run, then wait for this, and done
    })
})

test('should set up add expense with defaults to database store', (done) => {
  const store = createMockStore(defaultAuthState)
  const expenseData = {}

  store
    .dispatch(startAddExpense(expenseData))
    .then(() => {
      const actions = store.getActions()
      expect(actions[0]).toEqual({
        type: 'ADD_EXPENSE',
        expense: {
          id: expect.any(String),
          description: '',
          note: '',
          amount: 0,
          createdAt: 0,
        },
      })
      return database.ref(`users/${uid}/expenses/${actions[0].expense.id}`).once('value')
    })
    .then((snapshot) => {
      expect(snapshot.val()).toBeTruthy()
      done()
    })
})

test('should setup set expense action object with data', () => {
  const action = setExpenses(expenses)
  expect(action).toEqual({
    type: 'SET_EXPENSES',
    expenses,
  })
})

test('should fetch expenses from firebase', (done) => {
  const store = createMockStore(defaultAuthState)
  store.dispatch(startSetExpenses()).then(() => {
    const actions = store.getActions()
    expect(actions[0]).toEqual({
      type: 'SET_EXPENSES',
      expenses,
    })
    done()
  })
})
