// Class projects state management

class ProjectState {
    private projects: any[] = [];
    private static instance = new ProjectState();

    constructor() {

    };

    static getInstance() {
        if (this.instance){
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addProject(title: string, description: string, numberOfPeople: number) {
        const newProjects = {
            id: Math.random().toString(),
            title: title,
            description: description,
            people: numberOfPeople
        };
        this.projects.push(newProjects);
    }
}

const projectState = ProjectState.getInstance();

interface Validateable {
    value: string | number ,
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number,
}

function validate( validateableInput: Validateable) {
    let isValid = true;
    if (validateableInput.required) {
        isValid = isValid && validateableInput.value.toString().trim().length !== 0;
    }
    if ( validateableInput.minLength != null && typeof validateableInput.value === 'string' ){
        isValid = isValid && validateableInput.value.length >= validateableInput.minLength;
    }
    if (validateableInput.maxLength != null && typeof validateableInput.value === 'string' ){
        isValid = isValid && validateableInput.value.length <= validateableInput.maxLength;
    }
    if (validateableInput.min != null && typeof validateableInput.value === 'number'){
        isValid = isValid && validateableInput.value >= validateableInput.min;
    }
    if (validateableInput.max != null && typeof validateableInput.value === 'number'){
        isValid = isValid && validateableInput.value <= validateableInput.max;
    }
    return isValid;
}

function autobind(_: any ,_2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjDescriptor:PropertyDescriptor = {
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn
        }
    }
    return adjDescriptor;
};

// ProjectList Class
class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;

    constructor(private type: 'active' | 'finished'){
        this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true);

        this.element = importedNode.firstElementChild as HTMLElement;
        this.element.id = `${this.type}-projects`;

        this.renderContent();
        this.attach();
    }

    private renderContent () {
        const listId =  `${this.type}-project-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + 'PROJECTS';
    }
    
    private attach() {
        this.hostElement.insertAdjacentElement('beforeend', this.element)
    }
}

// ProjectInput class
class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateElement.content, true);

        this.element = importedNode.firstElementChild as HTMLFormElement;
        this.element.id = 'user-input';

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

        this.config();
        this.attach();
    }


    private getherUserInput (): [string, string, number] | undefined {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;

        const titleValidate: Validateable = {
            value: enteredTitle,
            required: true,
            minLength: 3,
        }
        const descriptionValidate: Validateable = {
            value: enteredDescription,
            required: true,
            minLength: 10,
            max: 500,
        }
        const peopleValidate: Validateable = {
            value: enteredPeople,
            min: 5,
            max: 10,
        }

        if (!validate(titleValidate) || !validate(descriptionValidate) || !validate(peopleValidate)) {
            alert('invalid input please try again!!')
            return;
        }else{
            return [enteredTitle, enteredDescription, +enteredPeople];
        }
    }

    private clearInput () {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }

    @autobind
    private submitHandler (event: Event) {
        event.preventDefault();
        const userInput = this.getherUserInput();

        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            console.log(title,desc,people);
            this.clearInput();
        }
    }

    private config () {
        this.element.addEventListener('submit', this.submitHandler.bind(this));    
    }


    private attach () {
        this.hostElement.insertAdjacentElement('afterbegin', this.element)
    }
}

const prjInput = new ProjectInput();
const activeProjectsList = new ProjectList('active');
const finishedProjectsList = new ProjectList('finished');