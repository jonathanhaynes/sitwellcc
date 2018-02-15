import React from 'react';
import {
  Route,
  Switch,
} from 'react-router-dom';

import Page from '../Page/Page';
import NotFound from '../../NotFound';

const News = (props) => (
  <Switch>
    <Route exact path='/news' render={routeProps => <h1>News</h1>}/>
    <Route path='/news/:title' render={routeProps => <Page {...routeProps} prismicCtx={props.prismicCtx} />}/>

    <Route component={NotFound} />
  </Switch>
);

export default News;
