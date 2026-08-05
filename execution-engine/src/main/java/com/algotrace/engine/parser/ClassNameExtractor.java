package com.algotrace.engine.parser;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;

public final class ClassNameExtractor {

    private ClassNameExtractor() {
    }

    public static String extract(String sourceCode) {

        CompilationUnit cu =
                StaticJavaParser.parse(sourceCode);

        return cu.findAll(ClassOrInterfaceDeclaration.class)
                .stream()
                .filter(ClassOrInterfaceDeclaration::isPublic)
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "No public class found in source code."
                        ))
                .getNameAsString();

    }

}