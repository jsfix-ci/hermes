import { empty, Observable } from "rxjs";
import { marbles } from "rxjs-marbles/jest";

import { Request } from "./request.decorator";
import { Message } from "./message.interface";
import { SEND, GET_NEW_ID, RESPONSES$ } from "./selectors";

describe('Request Decorator', () => {
  class Foo {
    @Request('bar')
    public baz(message: string) {
      return null;
    }
  }
  
  it('should initialize properly', () => {
    expect(Foo.prototype.baz).toBeTruthy();
  });

  it('should use send method of the client to send messages', () => {
    const instance = new Foo();

    instance[GET_NEW_ID] = jest.fn().mockReturnValue('1');
    instance[SEND] = jest.fn();
    instance[RESPONSES$] = empty();

    const res = instance.baz('test message');

    expect(instance[GET_NEW_ID]).toBeCalledTimes(1);
    expect(instance[SEND]).toBeCalledTimes(1);
    expect(instance[SEND]).toBeCalledWith({body: 'test message', id: '1', path: 'bar'} as Message);
    expect(res).toBeInstanceOf(Observable);
  });

  it('should return only body of the message', marbles(m => {
    const instance = new Foo();
  
    instance[GET_NEW_ID] = jest.fn().mockReturnValue('1');
    instance[SEND] = jest.fn();
    instance[RESPONSES$] = m.cold('a-b|', {
      a: {body: 'heyy', id: '1', completed: false},
      b: {id: '1', completed: true}
    });

    const res = instance.baz('test message');

    m.expect(res).toBeObservable('a-|', {a: 'heyy'});
  }));

  it('should listen until complete message received', marbles(m => {
    const instance = new Foo();

    instance[GET_NEW_ID] = jest.fn().mockReturnValue('1');
    instance[SEND] = jest.fn();
    instance[RESPONSES$] = m.cold('-a-b-c-d|', {
      a: {body: 'heyy', id: '1', completed: false},
      b: {body: 'hermes', id: '1', completed: false},
      c: {body: 'rocks', id: '1', completed: false},
      d: {id: '1', completed: true}
    });

    const res = instance.baz('test message');

    const expected = m.cold('-a-b-c-|', {
      a: 'heyy',
      b: 'hermes',
      c: 'rocks'
    });

    m.expect(res).toBeObservable(expected);
  }))
});
