package com.algotrace.engine.compiler;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.ToString;

import java.nio.file.Path;
import java.util.List;

@Getter
@ToString
@AllArgsConstructor
public class CompilationResult {

    private final boolean success;

    private final String className;

    private final Path sourceFile;

    private final Path classOutputDirectory;

    private final List<String> diagnostics;

}