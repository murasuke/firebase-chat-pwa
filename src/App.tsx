import React, { FC } from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import Chat from './Chat';

const App: FC = () => (
  <BrowserRouter>
    <Switch>
      <Route path="/chat1/:room" component={Chat} />
      <Route path="*">
        <Redirect to="/chat1/room1" />
      </Route>
    </Switch>
  </BrowserRouter>
);

export default App;
