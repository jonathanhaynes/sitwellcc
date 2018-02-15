import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';

import Page from '../Page/Page';
import NotFound from '../../NotFound';

const Contact = (props) => (
  <Switch>
    <Route exact path='/contact' render={routeProps => <h1>Contact</h1>}/>

    <Route component={NotFound} />
  </Switch>
);

export default Contact;
