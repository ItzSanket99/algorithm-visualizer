package com.algotrace.engine.executor;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
@AllArgsConstructor
public class ExecutionResult {

    private final boolean success;

    private final String output;

    private final Exception exception;

}