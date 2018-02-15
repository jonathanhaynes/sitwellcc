import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';

import Page from '../Page/Page';
import NotFound from '../../NotFound';

const Kit = (props) => (
  <Switch>
    <Route exact path='/kit' render={routeProps => <h1>Kit</h1>}/>

    <Route component={NotFound} />
  </Switch>
);

export default Kit;
